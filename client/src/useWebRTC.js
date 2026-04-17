import { useRef, useCallback } from 'react';
import { socket } from './socket';

// ICE server list — STUN for open/cone NAT, TURN relay for symmetric NAT.
// Credentials are intentionally inline (university project, public repo).
const ICE_SERVERS = [
    // ── STUN servers (free, no credentials) ──────────────────────────────────
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun3.l.google.com:19302' },
    { urls: 'stun:stun4.l.google.com:19302' },
    { urls: 'stun:stun.relay.metered.ca:80' },
    { urls: 'stun:stun.cloudflare.com:3478' },
    { urls: 'stun:global.stun.twilio.com:3478' },
    { urls: 'stun:stun.stunprotocol.org:3478' },
    { urls: 'stun:stun.ekiga.net' },
    { urls: 'stun:stun.ideasip.com' },
    { urls: 'stun:stun.schlund.de' },
    { urls: 'stun:stun.voiparound.com' },
    { urls: 'stun:stun.voipbuster.com' },
    { urls: 'stun:stun.voipstunt.com' },
    { urls: 'stun:stun.voxgratia.org' },
    // ── TURN relay (Metered.ca) ───────────────────────────────────────────────
    {
        urls: 'turn:global.relay.metered.ca:80',
        username: 'db35398d58c338b20c811fcd',
        credential: '3JE+pTC4CvGd1HbB',
    },
    {
        urls: 'turn:global.relay.metered.ca:80?transport=tcp',
        username: 'db35398d58c338b20c811fcd',
        credential: '3JE+pTC4CvGd1HbB',
    },
    {
        urls: 'turn:global.relay.metered.ca:443',
        username: 'db35398d58c338b20c811fcd',
        credential: '3JE+pTC4CvGd1HbB',
    },
    {
        urls: 'turns:global.relay.metered.ca:443?transport=tcp',
        username: 'db35398d58c338b20c811fcd',
        credential: '3JE+pTC4CvGd1HbB',
    },
];

export function useWebRTC({ localVideoRef, remoteVideoRef, onAudioBlocked, onIceState }) {
    const pcRef = useRef(null);
    const roomIdRef = useRef(null);
    // ICE candidates that arrived before setRemoteDescription was called
    const pendingCandidatesRef = useRef([]);

    const cleanup = useCallback(() => {
        if (pcRef.current) {
            pcRef.current.close();
            pcRef.current = null;
        }
        if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = null;
        }
        roomIdRef.current = null;
        pendingCandidatesRef.current = [];
    }, [remoteVideoRef]);

    // Flush any ICE candidates that arrived before setRemoteDescription
    const flushPendingCandidates = useCallback(async () => {
        const pc = pcRef.current;
        if (!pc) return;
        const pending = pendingCandidatesRef.current;
        pendingCandidatesRef.current = [];
        console.log('[ICE] flushing', pending.length, 'buffered candidates');
        for (const candidate of pending) {
            try {
                await pc.addIceCandidate(new RTCIceCandidate(candidate));
            } catch (e) {
                console.warn('[ICE] flush error:', e);
            }
        }
    }, []);

    const startCall = useCallback(async (roomId, isInitiator, localStream) => {
        cleanup();
        roomIdRef.current = roomId;

        console.log('[ICE] using', ICE_SERVERS.length, 'configured servers');
        const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
        pcRef.current = pc;

        localStream.getTracks().forEach(track => pc.addTrack(track, localStream));

        pc.ontrack = (event) => {
            if (!remoteVideoRef.current || !event.streams[0]) return;
            remoteVideoRef.current.srcObject = event.streams[0];
            remoteVideoRef.current.play().catch(() => {
                if (onAudioBlocked) onAudioBlocked(true);
            });
        };

        pc.onicecandidate = (event) => {
            if (event.candidate) {
                console.log('[ICE] sending candidate type=' + event.candidate.type, event.candidate.protocol, event.candidate.address);
                socket.emit('webrtc_ice_candidate', { roomId, payload: event.candidate });
            } else {
                console.log('[ICE] gathering complete (null candidate)');
            }
        };

        pc.oniceconnectionstatechange = () => {
            const s = pc.iceConnectionState;
            console.log('[ICE state]', s);
            if (onIceState) onIceState(s);
        };

        pc.onicegatheringstatechange = () => {
            console.log('[ICE gathering]', pc.iceGatheringState);
        };

        pc.onconnectionstatechange = () => {
            console.log('[peer connection]', pc.connectionState);
        };

        if (isInitiator) {
            console.log('[WebRTC] creating offer as initiator');
            const offer = await pc.createOffer({
                offerToReceiveAudio: true,
                offerToReceiveVideo: true,
            });
            await pc.setLocalDescription(offer);
            console.log('[WebRTC] offer sent');
            socket.emit('webrtc_offer', { roomId, payload: offer });
        } else {
            console.log('[WebRTC] waiting for offer as non-initiator');
        }
    }, [cleanup, remoteVideoRef, onAudioBlocked]);

    const handleOffer = useCallback(async (offer) => {
        const pc = pcRef.current;
        if (!pc) { console.error('[WebRTC] handleOffer: no peer connection'); return; }
        console.log('[WebRTC] received offer, setting remote description');
        await pc.setRemoteDescription(new RTCSessionDescription(offer));
        await flushPendingCandidates();
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        console.log('[WebRTC] answer sent');
        socket.emit('webrtc_answer', { roomId: roomIdRef.current, payload: answer });
    }, [flushPendingCandidates]);

    const handleAnswer = useCallback(async (answer) => {
        const pc = pcRef.current;
        if (!pc) { console.error('[WebRTC] handleAnswer: no peer connection'); return; }
        console.log('[WebRTC] received answer, setting remote description');
        await pc.setRemoteDescription(new RTCSessionDescription(answer));
        await flushPendingCandidates();
        console.log('[WebRTC] flushed', pendingCandidatesRef.current.length, 'buffered candidates');
    }, [flushPendingCandidates]);

    const handleIceCandidate = useCallback(async (candidate) => {
        const pc = pcRef.current;
        if (!pc) { console.warn('[ICE] received candidate but no peer connection'); return; }
        if (!pc.remoteDescription) {
            console.log('[ICE] buffering candidate (no remote desc yet), total=', pendingCandidatesRef.current.length + 1);
            pendingCandidatesRef.current.push(candidate);
            return;
        }
        try {
            await pc.addIceCandidate(new RTCIceCandidate(candidate));
            console.log('[ICE] applied candidate immediately');
        } catch (e) {
            console.warn('[ICE] addIceCandidate error:', e);
        }
    }, []);

    return { startCall, handleOffer, handleAnswer, handleIceCandidate, cleanup };
}
