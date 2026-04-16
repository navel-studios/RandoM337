'use strict';

class InMemoryPoolManager {
    constructor() {
        // Map<userId, PoolEntry>
        this._pool = new Map();
    }

    async addPlayer(userId, preferences) {
        if (this._pool.has(userId)) {
            throw new Error('User is already in the matchmaking pool');
        }
        this._pool.set(userId, {
            userId,
            preferences: preferences || {},
            joinedAt: new Date(),
            isLocked: false,
        });
    }

    async removePlayer(userId) {
        this._pool.delete(userId);
    }

    async getWaitingPlayers() {
        return Array.from(this._pool.values()).filter(entry => !entry.isLocked);
    }

    /**
     * Atomically lock two players so they can't be matched by another thread.
     * Returns false if either player is already locked or not in the pool.
     */
    async lockPlayers(userIdA, userIdB) {
        const entryA = this._pool.get(userIdA);
        const entryB = this._pool.get(userIdB);

        if (!entryA || !entryB || entryA.isLocked || entryB.isLocked) {
            return false;
        }

        entryA.isLocked = true;
        entryB.isLocked = true;
        return true;
    }
}

module.exports = InMemoryPoolManager;
