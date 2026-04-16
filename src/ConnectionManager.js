'use strict';

/**
 * Maintains a registry of active Socket.IO connections, keyed by userId.
 * Each connection object wraps a socket and exposes sendEvent / disconnect.
 */
class ConnectionManager {
    constructor() {
        // Map<userId, IUserConnection>
        this._connections = new Map();
        // Map<socketId, userId>
        this._socketToUser = new Map();
    }

    registerConnection(userId, socket) {
        const connection = {
            socket,
            sendEvent(eventName, payload) {
                socket.emit(eventName, payload);
            },
            disconnect() {
                socket.disconnect(true);
            },
        };
        this._connections.set(userId, connection);
        this._socketToUser.set(socket.id, userId);
        return connection;
    }

    removeConnection(socketId) {
        const userId = this._socketToUser.get(socketId);
        if (userId) {
            this._connections.delete(userId);
            this._socketToUser.delete(socketId);
        }
        return userId || null;
    }

    getUserConnection(userId) {
        return this._connections.get(userId) || null;
    }

    getUserIdBySocket(socketId) {
        return this._socketToUser.get(socketId) || null;
    }
}

module.exports = ConnectionManager;
