import { io } from 'socket.io-client';

const SERVER_URL = import.meta.env.VITE_SERVER_URL || window.location.origin;

export const socket = io(SERVER_URL, {
    autoConnect: false,
    // Force WebSocket from the start — skip the HTTP long-polling upgrade.
    // On Railway (and most reverse proxies) the polling→WebSocket upgrade can
    // reorder signaling messages, causing ICE candidates to arrive before the
    // remote description is applied even with the candidate buffer in place.
    transports: ['websocket'],
});
