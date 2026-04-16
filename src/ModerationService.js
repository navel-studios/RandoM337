'use strict';

const { v4: uuidv4 } = require('uuid');

class ModerationService {
    /**
     * @param {IReportRepository} reportRepo
     * @param {IBanRepository} banRepo
     * @param {IRoomManager} roomManager
     */
    constructor(reportRepo, banRepo, roomManager) {
        this.reportRepo = reportRepo;
        this.banRepo = banRepo;
        this.roomManager = roomManager;
    }

    /**
     * File a report against a user. Immediately destroys the shared room if one exists.
     * Requires a screenshot as evidence.
     */
    async submitReport(reporterId, reportedId, reason, frameData) {
        if (!frameData) {
            throw new Error('Screenshot evidence is required to submit a report');
        }

        const room = await this.roomManager.getRoom(reporterId, reportedId);
        if (room) {
            await this.roomManager.destroyRoom(room.roomId);
        }

        await this.reportRepo.saveReport({
            reportId: uuidv4(),
            reporterId,
            reportedUserId: reportedId,
            reason,
            screenshotDataUrl: frameData,
            status: 'PENDING',
            createdAt: new Date(),
        });
    }

    /**
     * Admin reviews a pending report. Approving issues a ban; rejecting closes it.
     */
    async reviewReport(adminId, reportId, isValid, banHours) {
        const report = await this.reportRepo.findById(reportId);
        if (!report) {
            throw new Error('Report not found');
        }

        if (isValid) {
            await this.reportRepo.updateStatus(reportId, 'RESOLVED_BANNED');

            const expiresAt = new Date(Date.now() + banHours * 60 * 60 * 1000);
            await this.banRepo.saveBan({
                banId: uuidv4(),
                userId: report.reportedUserId,
                reason: `Violation confirmed by ${adminId}`,
                expiresAt,
            });
        } else {
            await this.reportRepo.updateStatus(reportId, 'REJECTED_FALSE_CLAIM');
        }
    }

    /**
     * Returns true if the user is allowed to use the service (no active ban).
     */
    async verifyUserAccess(userId) {
        const ban = await this.banRepo.findActiveBan(userId);
        if (!ban) return true;
        return !ban.isActive();
    }
}

module.exports = ModerationService;
