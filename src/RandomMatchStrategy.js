'use strict';

class RandomMatchStrategy {
    /**
     * Return the first available player in the pool that isn't the current user.
     * "Random" here is fair because the pool itself is FIFO — the longer you wait,
     * the closer to the front you are.
     */
    findMatch(currentUser, pool) {
        const candidates = pool.filter(p => p.userId !== currentUser.userId && !p.isLocked);
        if (candidates.length === 0) return null;
        return candidates[Math.floor(Math.random() * candidates.length)];
    }
}

module.exports = RandomMatchStrategy;
