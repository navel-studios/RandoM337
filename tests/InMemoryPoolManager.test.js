const InMemoryPoolManager = require('../src/InMemoryPoolManager');

describe('InMemoryPoolManager', () => {
    let poolManager;

    beforeEach(() => {
        poolManager = new InMemoryPoolManager();
    });

    describe('Adding and Removing Users', () => {
        it('should add a new user to the pool', async () => {
            await poolManager.addPlayer('user-1', { tags: [] });
            const waiting = await poolManager.getWaitingPlayers();
            
            expect(waiting).toHaveLength(1);
            expect(waiting[0].userId).toBe('user-1');
            expect(waiting[0].isLocked).toBe(false);
        });

        it('should throw an error if trying to add a user already in the pool', async () => {
            await poolManager.addPlayer('user-1', { tags: [] });
            
            // Testing Requirement 1: Prevent duplicates
            await expect(poolManager.addPlayer('user-1', { tags: [] }))
                .rejects.toThrow('User is already in the matchmaking pool');
                
            const waiting = await poolManager.getWaitingPlayers();
            expect(waiting).toHaveLength(1); // Still only 1 entry
        });

        it('should remove a user completely when requested', async () => {
            await poolManager.addPlayer('user-1', { tags: [] });
            await poolManager.removePlayer('user-1');
            
            const waiting = await poolManager.getWaitingPlayers();
            expect(waiting).toHaveLength(0);
        });
    });

    describe('Atomic Locking (Concurrency Protection)', () => {
        it('should successfully lock two unlocked users', async () => {
            await poolManager.addPlayer('user-1', {});
            await poolManager.addPlayer('user-2', {});

            const lockSuccess = await poolManager.lockPlayers('user-1', 'user-2');
            expect(lockSuccess).toBe(true);
        });

        it('should fail to lock if one of the users is already locked by another thread', async () => {
            await poolManager.addPlayer('user-1', {});
            await poolManager.addPlayer('user-2', {});
            await poolManager.addPlayer('user-3', {});

            // Thread A locks user-1 and user-2
            await poolManager.lockPlayers('user-1', 'user-2');

            // Thread B tries to lock user-2 and user-3 simultaneously
            const lockSuccess = await poolManager.lockPlayers('user-2', 'user-3');
            
            // Must fail to prevent user-2 from joining two rooms at once
            expect(lockSuccess).toBe(false); 
        });
    });
});