'use strict';

class SignalingService {
    /**
     * @param {IRoomManager} roomManager
     * @param {ConnectionManager} connectionManager
     */
    constructor(roomManager, connectionManager) {
        this.roomManager = roomManager;
        this.connectionManager = connectionManager;
    }

    async relayOffer(senderId, roomId, payload) {
        const { partnerId } = await this._verifyAndGetPartner(senderId, roomId, payload);
        const conn = this._getPartnerConnection(partnerId);
        conn.sendEvent('webrtc_offer', payload);
    }

    async relayAnswer(senderId, roomId, payload) {
        const { partnerId } = await this._verifyAndGetPartner(senderId, roomId, payload);
        const conn = this._getPartnerConnection(partnerId);
        conn.sendEvent('webrtc_answer', payload);
    }

    async relayIceCandidate(senderId, roomId, payload) {
        const { partnerId } = await this._verifyAndGetPartner(senderId, roomId, payload);
        const conn = this._getPartnerConnection(partnerId);
        conn.sendEvent('webrtc_ice_candidate', payload);
    }

    // ─── Private helpers ───────────────────────────────────────────────────────

    async _verifyAndGetPartner(senderId, roomId, payload) {
        if (!payload) {
            throw new Error('Invalid signaling payload');
        }

        const room = await this.roomManager.getRoom(roomId);
        if (!room) {
            throw new Error('Room not found or no longer active');
        }

        if (room.peerA_Id !== senderId && room.peerB_Id !== senderId) {
            throw new Error('Unauthorized: You do not belong to this room');
        }

        const partnerId = room.peerA_Id === senderId ? room.peerB_Id : room.peerA_Id;
        return { room, partnerId };
    }

    _getPartnerConnection(partnerId) {
        const conn = this.connectionManager.getUserConnection(partnerId);
        if (!conn) {
            throw new Error('Partner connection lost');
        }
        return conn;
    }
}

module.exports = SignalingService;
