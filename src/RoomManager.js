'use strict';

const { v4: uuidv4 } = require('uuid');

class RoomManager {
    constructor() {
        // Map<roomId, CallSession>
        this._rooms = new Map();
        // Map<userId, roomId> for quick reverse lookup
        this._userToRoom = new Map();
    }

    async createRoom(userAId, userBId, challenge) {
        const roomId = uuidv4();
        const session = {
            roomId,
            peerA_Id: userAId,
            peerB_Id: userBId,
            activeChallenge: challenge,
            createdAt: new Date(),
            isActive: true,
        };
        this._rooms.set(roomId, session);
        this._userToRoom.set(userAId, roomId);
        this._userToRoom.set(userBId, roomId);
        return session;
    }

    async destroyRoom(roomId) {
        const room = this._rooms.get(roomId);
        if (!room) return;
        this._userToRoom.delete(room.peerA_Id);
        this._userToRoom.delete(room.peerB_Id);
        this._rooms.delete(roomId);
    }

    async getRoom(roomId) {
        return this._rooms.get(roomId) || null;
    }

    async getActiveRoomByUserId(userId) {
        const roomId = this._userToRoom.get(userId);
        if (!roomId) return null;
        return this._rooms.get(roomId) || null;
    }
}

module.exports = RoomManager;
