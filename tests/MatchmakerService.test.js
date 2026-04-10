const MatchmakerService = require('./MatchmakerService');

describe('MatchmakerService Lifecycle', () => {
    let matchmakerService;
    let mockPoolManager;
    let mockMatchStrategy;
    let mockRoomManager;
    let mockChallengeService;

    beforeEach(() => {
        // We simulate a stateful pool to accurately test > 5 users
        let internalPool = [
            { userId: 'user-1', isLocked: false },
            { userId: 'user-2', isLocked: false },
            { userId: 'user-3', isLocked: false },
            { userId: 'user-4', isLocked: false },
            { userId: 'user-5', isLocked: false }
        ];

        mockPoolManager = {
            getWaitingPlayers: jest.fn(async () => internalPool.filter(p => !p.isLocked)),
            lockPlayers: jest.fn(async (idA, idB) => {
                const uA = internalPool.find(p => p.userId === idA);
                const uB = internalPool.find(p => p.userId === idB);
                if (uA && uB && !uA.isLocked && !uB.isLocked) {
                    uA.isLocked = true;
                    uB.isLocked = true;
                    return true;
                }
                return false;
            }),
            removePlayer: jest.fn(async (id) => {
                internalPool = internalPool.filter(p => p.userId !== id);
            })
        };

        mockMatchStrategy = {
            // Simple mock strategy: always pair the first two available users
            findMatch: jest.fn((currentUser, pool) => pool.find(p => p.userId !== currentUser.userId))
        };

        mockRoomManager = {
            createRoom: jest.fn().mockResolvedValue({ roomId: 'new-room-123' }),
            destroyRoom: jest.fn().mockResolvedValue(),
            getActiveRoomByUserId: jest.fn()
        };

        mockChallengeService = {
            getRandomChallenge: jest.fn().mockResolvedValue({ text: 'Test Challenge' })
        };

        matchmakerService = new MatchmakerService(mockPoolManager, mockMatchStrategy, mockRoomManager, mockChallengeService);
        
        // Mock the event emitter logic (assuming a connectionManager is used to send WebSocket events)
        matchmakerService.emitToUser = jest.fn(); 
    });

    describe('Process Queue (>= 5 users)', () => {
        it('should correctly pair 2 users, create a room, remove them from the pool, and leave 3 users waiting', async () => {
            // Trigger the engine for user-1
            await matchmakerService.processQueue({ userId: 'user-1' });

            // 1. Verify Strategy was called
            expect(mockMatchStrategy.findMatch).toHaveBeenCalled();

            // 2. Verify Room Creation
            expect(mockRoomManager.createRoom).toHaveBeenCalledWith('user-1', 'user-2', expect.any(Object));

            // 3. Verify Removal from Pool (Testing Requirement 2)
            expect(mockPoolManager.removePlayer).toHaveBeenCalledWith('user-1');
            expect(mockPoolManager.removePlayer).toHaveBeenCalledWith('user-2');

            // 4. Verify the remaining pool state
            const remaining = await mockPoolManager.getWaitingPlayers();
            expect(remaining).toHaveLength(3);
            expect(remaining.map(p => p.userId)).toEqual(['user-3', 'user-4', 'user-5']);

            // 5. Verify clients were notified
            expect(matchmakerService.emitToUser).toHaveBeenCalledWith('user-1', 'match_found', expect.any(Object));
            expect(matchmakerService.emitToUser).toHaveBeenCalledWith('user-2', 'match_found', expect.any(Object));
        });

        it('should abort and do nothing if only 1 user is in the queue', async () => {
            // Override the pool to only have 1 user
            mockPoolManager.getWaitingPlayers.mockResolvedValueOnce([{ userId: 'user-1', isLocked: false }]);
            mockMatchStrategy.findMatch.mockReturnValueOnce(null); // No match found

            await matchmakerService.processQueue({ userId: 'user-1' });

            // State should remain untouched
            expect(mockPoolManager.lockPlayers).not.toHaveBeenCalled();
            expect(mockRoomManager.createRoom).not.toHaveBeenCalled();
        });
    });

    describe('Handling Aborts and Disconnects', () => {
        it('should remove the user completely if connection is aborted while in the waiting pool', async () => {
            // User closes the tab while waiting
            await matchmakerService.handleDisconnect('user-3');

            expect(mockPoolManager.removePlayer).toHaveBeenCalledWith('user-3');
            expect(mockRoomManager.destroyRoom).not.toHaveBeenCalled(); // Wasn't in a room
        });

        it('should destroy the room and notify the partner if connection is aborted during an active call', async () => {
            // Testing Requirement 3: Cleanup on abort
            // Simulate user-1 being in an active room with user-2
            mockRoomManager.getActiveRoomByUserId.mockResolvedValueOnce({
                roomId: 'room-active-1',
                peerA_Id: 'user-1',
                peerB_Id: 'user-2'
            });

            await matchmakerService.handleDisconnect('user-1');

            // Ensure room is destroyed
            expect(mockRoomManager.destroyRoom).toHaveBeenCalledWith('room-active-1');
            
            // Ensure partner is notified that the other person disconnected
            expect(matchmakerService.emitToUser).toHaveBeenCalledWith('user-2', 'partner_disconnected', {});
        });
    });
});