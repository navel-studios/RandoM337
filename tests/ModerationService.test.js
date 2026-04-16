const ModerationService = require('../src/ModerationService');

describe('ModerationService', () => {
    let moderationService;
    let mockReportRepo;
    let mockBanRepo;
    let mockRoomManager;

    beforeEach(() => {
        // Mocking the repositories and external managers
        mockReportRepo = { 
            saveReport: jest.fn().mockResolvedValue(),
            findById: jest.fn(),
            updateStatus: jest.fn().mockResolvedValue()
        };
        
        mockBanRepo = { 
            findActiveBan: jest.fn(),
            saveBan: jest.fn().mockResolvedValue()
        };
        
        mockRoomManager = { 
            getRoom: jest.fn(),
            destroyRoom: jest.fn().mockResolvedValue() 
        };

        moderationService = new ModerationService(mockReportRepo, mockBanRepo, mockRoomManager);
    });

    describe('1. Submitting Reports (submitReport)', () => {
        it('Happy Path: Should instantly destroy the room and save a valid report', async () => {
            const reporterId = 'user-1';
            const reportedId = 'user-2';
            const reason = 'Inappropriate content';
            const frameData = 'data:image/png;base64,iVBORw0KGgo...';
            
            // Mock that these users are in an active room
            mockRoomManager.getRoom.mockResolvedValue({ 
                roomId: 'room-999', 
                peerA_Id: reporterId, 
                peerB_Id: reportedId 
            });

            await moderationService.submitReport(reporterId, reportedId, reason, frameData);

            // Safety check: The room MUST be destroyed immediately
            expect(mockRoomManager.destroyRoom).toHaveBeenCalledWith('room-999');
            
            // Data check: The report must be saved correctly
            expect(mockReportRepo.saveReport).toHaveBeenCalledWith(expect.objectContaining({
                reporterId,
                reportedUserId: reportedId,
                reason,
                screenshotDataUrl: frameData,
                status: 'PENDING'
            }));
        });

        it('Failure: Should throw an error if the evidence (screenshot) is missing', async () => {
            await expect(moderationService.submitReport('user-1', 'user-2', 'reason', null))
                .rejects.toThrow('Screenshot evidence is required to submit a report');
                
            expect(mockRoomManager.destroyRoom).not.toHaveBeenCalled();
            expect(mockReportRepo.saveReport).not.toHaveBeenCalled();
        });

        it('Edge Case: Should still save the report even if the room was already closed (e.g., offender quickly disconnected)', async () => {
            // Mock room as not found (null)
            mockRoomManager.getRoom.mockResolvedValue(null);

            await moderationService.submitReport('user-1', 'user-2', 'Toxicity', 'data:image/...');

            // Shouldn't crash trying to destroy a null room
            expect(mockRoomManager.destroyRoom).not.toHaveBeenCalled();
            
            // But the report must still be filed against the offender
            expect(mockReportRepo.saveReport).toHaveBeenCalled();
        });
    });

    describe('2. Reviewing Reports (reviewReport)', () => {
        it('Action: Admin approves report -> Should update status and issue a ban', async () => {
            const reportId = 'rep-123';
            const reportedId = 'toxic-user';
            
            // Mock the report existing in the DB
            mockReportRepo.findById.mockResolvedValue({
                reportId,
                reportedUserId: reportedId,
                status: 'PENDING'
            });

            // Admin decides it's valid and issues a 24-hour ban
            await moderationService.reviewReport('admin-1', reportId, true, 24);

            expect(mockReportRepo.updateStatus).toHaveBeenCalledWith(reportId, 'RESOLVED_BANNED');
            expect(mockBanRepo.saveBan).toHaveBeenCalledWith(expect.objectContaining({
                userId: reportedId,
                reason: 'Violation confirmed by admin-1'
                // We'd ideally check if expiresAt is set to 24h in the future here
            }));
        });

        it('Action: Admin rejects report -> Should close report and NOT issue a ban', async () => {
            const reportId = 'rep-123';
            
            mockReportRepo.findById.mockResolvedValue({
                reportId,
                reportedUserId: 'innocent-user',
                status: 'PENDING'
            });

            // Admin decides it's a false report (isValid = false)
            await moderationService.reviewReport('admin-1', reportId, false, 0);

            expect(mockReportRepo.updateStatus).toHaveBeenCalledWith(reportId, 'REJECTED_FALSE_CLAIM');
            expect(mockBanRepo.saveBan).not.toHaveBeenCalled(); // No ban issued
        });

        it('Failure: Should throw an error if the report does not exist', async () => {
            mockReportRepo.findById.mockResolvedValue(null);

            await expect(moderationService.reviewReport('admin-1', 'ghost-report', true, 24))
                .rejects.toThrow('Report not found');
        });
    });

    describe('3. Verifying Access (verifyUserAccess)', () => {
        it('Happy Path: Should allow access if the user has no history of bans', async () => {
            mockBanRepo.findActiveBan.mockResolvedValue(null);

            const hasAccess = await moderationService.verifyUserAccess('clean-user');
            expect(hasAccess).toBe(true);
        });

        it('Failure: Should deny access if the user has an active, unexpired ban', async () => {
            mockBanRepo.findActiveBan.mockResolvedValue({
                banId: 'ban-1',
                userId: 'banned-user',
                isActive: () => true 
            });

            const hasAccess = await moderationService.verifyUserAccess('banned-user');
            expect(hasAccess).toBe(false);
        });

        it('Edge Case: Should allow access if a past ban exists but has already expired', async () => {
            mockBanRepo.findActiveBan.mockResolvedValue({
                banId: 'ban-old',
                userId: 'rehabilitated-user',
                isActive: () => false // The ban's expiration date has passed
            });

            const hasAccess = await moderationService.verifyUserAccess('rehabilitated-user');
            expect(hasAccess).toBe(true);
        });
    });
});