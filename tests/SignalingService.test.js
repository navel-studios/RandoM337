const SignalingService = require('../src/SignalingService');

describe('SignalingService', () => {
    let signalingService;
    let mockRoomManager;
    let mockConnectionManager;
    let mockPartnerConnection;

    beforeEach(() => {
        mockRoomManager = { 
            getRoom: jest.fn() 
        };
        
        mockPartnerConnection = { 
            sendEvent: jest.fn() 
        };
        
        mockConnectionManager = { 
            getUserConnection: jest.fn() 
        };

        signalingService = new SignalingService(mockRoomManager, mockConnectionManager);
    });

    describe('Happy Paths (Successful Relays)', () => {
        it('should successfully relay an SDP offer to the correct partner', async () => {
            const senderId = 'user-A';
            const partnerId = 'user-B';
            const roomId = 'room-123';
            const payload = { type: 'offer', sdp: 'v=0...' };

            mockRoomManager.getRoom.mockResolvedValue({
                roomId,
                peerA_Id: senderId,
                peerB_Id: partnerId
            });
            mockConnectionManager.getUserConnection.mockReturnValue(mockPartnerConnection);

            await signalingService.relayOffer(senderId, roomId, payload);

            expect(mockConnectionManager.getUserConnection).toHaveBeenCalledWith(partnerId);
            expect(mockPartnerConnection.sendEvent).toHaveBeenCalledWith('webrtc_offer', payload);
        });

        it('should successfully relay an ICE candidate to the correct partner', async () => {
            const senderId = 'user-B';
            const partnerId = 'user-A'; // Testing reverse direction
            const roomId = 'room-123';
            const payload = { candidate: 'candidate:1 1 UDP...', sdpMid: '0', sdpMLineIndex: 0 };

            mockRoomManager.getRoom.mockResolvedValue({
                roomId,
                peerA_Id: partnerId,
                peerB_Id: senderId
            });
            mockConnectionManager.getUserConnection.mockReturnValue(mockPartnerConnection);

            await signalingService.relayIceCandidate(senderId, roomId, payload);

            expect(mockConnectionManager.getUserConnection).toHaveBeenCalledWith(partnerId);
            expect(mockPartnerConnection.sendEvent).toHaveBeenCalledWith('webrtc_ice_candidate', payload);
        });
    });

    describe('Failure Scenarios & Edge Cases', () => {
        it('Failure 1: Should throw if the requested room does not exist (expired/skipped)', async () => {
            const senderId = 'user-A';
            const roomId = 'room-already-destroyed';
            const payload = { type: 'offer', sdp: 'v=0...' };

            // RoomManager returns null or undefined
            mockRoomManager.getRoom.mockResolvedValue(null);

            await expect(signalingService.relayOffer(senderId, roomId, payload))
                .rejects.toThrow('Room not found or no longer active');
                
            expect(mockConnectionManager.getUserConnection).not.toHaveBeenCalled();
        });

        it('Failure 2: Should throw an Unauthorized error if the sender is NOT in the room', async () => {
            const maliciousSenderId = 'hacker-99';
            const roomId = 'room-123';
            const payload = { type: 'offer', sdp: 'v=0...' };

            // Room exists, but the sender isn't one of the peers
            mockRoomManager.getRoom.mockResolvedValue({
                roomId,
                peerA_Id: 'user-A',
                peerB_Id: 'user-B'
            });

            await expect(signalingService.relayOffer(maliciousSenderId, roomId, payload))
                .rejects.toThrow('Unauthorized: You do not belong to this room');
                
            expect(mockConnectionManager.getUserConnection).not.toHaveBeenCalled();
        });

        it('Failure 3: Should handle the case where the partner has silently disconnected (Socket missing)', async () => {
            const senderId = 'user-A';
            const partnerId = 'user-B';
            const roomId = 'room-123';
            const payload = { type: 'answer', sdp: 'v=0...' };

            mockRoomManager.getRoom.mockResolvedValue({
                roomId,
                peerA_Id: senderId,
                peerB_Id: partnerId
            });
            
            // ConnectionManager cannot find the partner's active socket
            mockConnectionManager.getUserConnection.mockReturnValue(null);

            await expect(signalingService.relayAnswer(senderId, roomId, payload))
                .rejects.toThrow('Partner connection lost');
                
            expect(mockPartnerConnection.sendEvent).not.toHaveBeenCalled();
        });

        it('Failure 4: Should throw if the signaling payload is malformed or missing', async () => {
            const senderId = 'user-A';
            const roomId = 'room-123';
            const invalidPayload = null; // Client sent empty data

            mockRoomManager.getRoom.mockResolvedValue({
                roomId,
                peerA_Id: senderId,
                peerB_Id: 'user-B'
            });

            await expect(signalingService.relayOffer(senderId, roomId, invalidPayload))
                .rejects.toThrow('Invalid signaling payload');
                
            expect(mockConnectionManager.getUserConnection).not.toHaveBeenCalled();
        });
    });
});