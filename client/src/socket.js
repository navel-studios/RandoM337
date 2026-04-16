import { io } from 'socket.io-client';

// In dev the Vite proxy forwards /socket.io -> localhost:3000
// In production the client is served from the same origin as the server
const SERVER_URL = import.meta.env.VITE_SERVER_URL || window.location.origin;

export const socket = io(SERVER_URL, { autoConnect: false });
