'use strict';

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const ConnectionManager = require('./src/ConnectionManager');
const RoomManager = require('./src/RoomManager');
const InMemoryPoolManager = require('./src/InMemoryPoolManager');
const RandomMatchStrategy = require('./src/RandomMatchStrategy');
const MatchmakerService = require('./src/MatchmakerService');
const SignalingService = require('./src/SignalingService');
const ChallengeService = require('./src/ChallengeService');

// ─── Setup ────────────────────────────────────────────────────────────────────

const app = express();
const httpServer = http.createServer(app);

const io = new Server(httpServer, {
    cors: {
        origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
        methods: ['GET', 'POST'],
    },
});

// ─── Service Wiring ───────────────────────────────────────────────────────────

const connectionManager = new ConnectionManager();
const roomManager = new RoomManager();
const poolManager = new InMemoryPoolManager();
const matchStrategy = new RandomMatchStrategy();
const challengeService = new ChallengeService();
const matchmakerService = new MatchmakerService(poolManager, matchStrategy, roomManager, challengeService);
const signalingService = new SignalingService(roomManager, connectionManager);

// Wire up real emit so MatchmakerService can push events to users
matchmakerService.emitToUser = (userId, event, data) => {
    const conn = connectionManager.getUserConnection(userId);
    if (conn) conn.sendEvent(event, data);
};

// ─── ICE server credentials endpoint ─────────────────────────────────────────
// Fetches short-lived TURN credentials from Metered.ca.
// Set METERED_APP_NAME and METERED_API_KEY as Railway env vars.
// Falls back to STUN-only if not configured (same-device testing still works).

app.get('/api/ice-servers', (_req, res) => {
    const username   = process.env.METERED_USERNAME;
    const credential = process.env.METERED_CREDENTIAL;

    const stun = [
        // Google (4 IPs for redundancy)
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' },
        { urls: 'stun:stun3.l.google.com:19302' },
        { urls: 'stun:stun4.l.google.com:19302' },
        // Metered STUN
        { urls: 'stun:stun.relay.metered.ca:80' },
        // Cloudflare
        { urls: 'stun:stun.cloudflare.com:3478' },
        // Twilio
        { urls: 'stun:global.stun.twilio.com:3478' },
        // Other well-known public servers
        { urls: 'stun:stun.stunprotocol.org:3478' },
        { urls: 'stun:stun.ekiga.net' },
        { urls: 'stun:stun.ideasip.com' },
        { urls: 'stun:stun.schlund.de' },
        { urls: 'stun:stun.voiparound.com' },
        { urls: 'stun:stun.voipbuster.com' },
        { urls: 'stun:stun.voipstunt.com' },
        { urls: 'stun:stun.voxgratia.org' },
    ];

    if (!username || !credential) {
        console.warn('[TURN] METERED_USERNAME/CREDENTIAL not set — returning STUN only');
        return res.json(stun);
    }

    const turn = [
        { urls: 'turn:global.relay.metered.ca:80',                   username, credential },
        { urls: 'turn:global.relay.metered.ca:80?transport=tcp',      username, credential },
        { urls: 'turn:global.relay.metered.ca:443',                   username, credential },
        { urls: 'turns:global.relay.metered.ca:443?transport=tcp',    username, credential },
    ];

    res.json([...stun, ...turn]);
});

// ─── Static serving (production only) ────────────────────────────────────────
// In development the Vite dev server (port 5173) serves the frontend.
// Only serve the built dist/ folder when it actually exists.

const clientDist = path.join(__dirname, 'client', 'dist');
const fs = require('fs');
if (fs.existsSync(clientDist)) {
    app.use(express.static(clientDist));
    app.get('*', (_req, res) => {
        res.sendFile(path.join(clientDist, 'index.html'));
    });
} else {
    app.get('/', (_req, res) => {
        res.send('RandoM337 backend running. Start the Vite dev server (cd client && npm run dev) for the frontend.');
    });
}

// ─── Socket.IO Events ─────────────────────────────────────────────────────────

io.on('connection', (socket) => {
    console.log(`[connect] ${socket.id}`);

    // Each socket gets a server-assigned anonymous userId (socket.id works fine for MVP)
    const userId = socket.id;
    connectionManager.registerConnection(userId, socket);
    socket.emit('assigned_id', { userId });

    // ── Matchmaking ─────────────────────────────────────────────────────────

    socket.on('join_queue', async (data) => {
        try {
            const preferences = (data && data.preferences) || {};
            // Add to pool first so we can confirm queued...
            await poolManager.addPlayer(userId, preferences);
            // ...then confirm to the client BEFORE running processQueue.
            // processQueue may immediately emit match_found; if queue_joined
            // were sent after, it would overwrite the IN_CALL state on the client.
            socket.emit('queue_joined', {});
            await matchmakerService.processQueue({ userId });
        } catch (err) {
            socket.emit('error', { message: err.message });
        }
    });

    socket.on('leave_queue', async () => {
        try {
            await matchmakerService.leaveQueue(userId);
            socket.emit('queue_left', {});
        } catch (err) {
            socket.emit('error', { message: err.message });
        }
    });

    // ── WebRTC Signaling ────────────────────────────────────────────────────

    socket.on('webrtc_offer', async ({ roomId, payload }) => {
        console.log(`[offer]  from=${userId.slice(0,8)} room=${roomId}`);
        try {
            await signalingService.relayOffer(userId, roomId, payload);
            console.log(`[offer]  relayed OK`);
        } catch (err) {
            console.error(`[offer]  ERROR: ${err.message}`);
            socket.emit('error', { message: err.message });
        }
    });

    socket.on('webrtc_answer', async ({ roomId, payload }) => {
        console.log(`[answer] from=${userId.slice(0,8)} room=${roomId}`);
        try {
            await signalingService.relayAnswer(userId, roomId, payload);
            console.log(`[answer] relayed OK`);
        } catch (err) {
            console.error(`[answer] ERROR: ${err.message}`);
            socket.emit('error', { message: err.message });
        }
    });

    socket.on('webrtc_ice_candidate', async ({ roomId, payload }) => {
        console.log(`[ice]    from=${userId.slice(0,8)} room=${roomId}`);
        try {
            await signalingService.relayIceCandidate(userId, roomId, payload);
        } catch (err) {
            console.error(`[ice]    ERROR: ${err.message}`);
            socket.emit('error', { message: err.message });
        }
    });

    // ── Skip / End call ─────────────────────────────────────────────────────

    socket.on('skip', async ({ roomId }) => {
        try {
            const room = await roomManager.getRoom(roomId);
            if (room) {
                await roomManager.destroyRoom(roomId);
                const partnerId = room.peerA_Id === userId ? room.peerB_Id : room.peerA_Id;
                matchmakerService.emitToUser(partnerId, 'partner_skipped', {});
            }
        } catch (err) {
            socket.emit('error', { message: err.message });
        }
    });

    // ── Disconnect ──────────────────────────────────────────────────────────

    socket.on('disconnect', async () => {
        console.log(`[disconnect] ${socket.id}`);
        connectionManager.removeConnection(socket.id);
        try {
            await matchmakerService.handleDisconnect(userId);
        } catch (err) {
            console.error('[disconnect error]', err.message);
        }
    });
});

// ─── Start ────────────────────────────────────────────────────────────────────

const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
    console.log(`RandoM337 server listening on http://localhost:${PORT}`);
});
