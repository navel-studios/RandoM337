'use strict';

class MatchmakerService {
    /**
     * @param {IPoolManager} poolManager
     * @param {IMatchStrategy} matchStrategy
     * @param {IRoomManager} roomManager
     * @param {IChallengeService} challengeService
     */
    constructor(poolManager, matchStrategy, roomManager, challengeService) {
        this.poolManager = poolManager;
        this.matchStrategy = matchStrategy;
        this.roomManager = roomManager;
        this.challengeService = challengeService;
    }

    /**
     * Add a user to the waiting pool and attempt to find them a match.
     */
    async joinQueue(userId, preferences) {
        await this.poolManager.addPlayer(userId, preferences);
        await this.processQueue({ userId });
    }

    /**
     * Remove a user from the waiting pool without entering a room.
     */
    async leaveQueue(userId) {
        await this.poolManager.removePlayer(userId);
    }

    /**
     * Core matchmaking loop. Tries to pair the given user with someone from the pool.
     */
    async processQueue(currentUser) {
        const waiting = await this.poolManager.getWaitingPlayers();

        const opponent = this.matchStrategy.findMatch(currentUser, waiting);
        if (!opponent) return;

        const locked = await this.poolManager.lockPlayers(currentUser.userId, opponent.userId);
        if (!locked) return;

        const challenge = await this.challengeService.getRandomChallenge();
        const room = await this.roomManager.createRoom(currentUser.userId, opponent.userId, challenge);

        await this.poolManager.removePlayer(currentUser.userId);
        await this.poolManager.removePlayer(opponent.userId);

        this.emitToUser(currentUser.userId, 'match_found', { roomId: room.roomId, challenge });
        this.emitToUser(opponent.userId, 'match_found', { roomId: room.roomId, challenge });
    }

    /**
     * Called when a socket disconnects. Cleans up pool or active room.
     */
    async handleDisconnect(userId) {
        const activeRoom = await this.roomManager.getActiveRoomByUserId(userId);

        if (activeRoom) {
            await this.roomManager.destroyRoom(activeRoom.roomId);
            const partnerId = activeRoom.peerA_Id === userId ? activeRoom.peerB_Id : activeRoom.peerA_Id;
            this.emitToUser(partnerId, 'partner_disconnected', {});
        } else {
            await this.poolManager.removePlayer(userId);
        }
    }

    /**
     * Emit a Socket.IO event to a specific user.
     * Overridden in tests; replaced with real ConnectionManager in production.
     */
    emitToUser(userId, event, data) {
        // no-op by default; wired up externally
    }
}

module.exports = MatchmakerService;
