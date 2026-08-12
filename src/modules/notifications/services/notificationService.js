const notificationRepository = require("../repositories/notificationRepository");
const { getIO } = require("../../../infrastructure/socket/socketServer");

class NotificationService {
    async createNotification({
        userId,
        type,
        title,
        message,
        data = {}
    }) {
        const notification =
            await notificationRepository.create({
                user: userId,
                type,
                title,
                message,
                data
            });

        // Send realtime notification
        try {
            const io = getIO();

            io.to(`user:${userId}`).emit(
                "notification",
                notification
            );
        } catch (error) {
            // Socket.IO should not make notification persistence fail
            console.warn(
                "Failed to emit notification via Socket.IO:",
                error.message
            );
        }

        return notification;
    }

    async getUserNotifications(userId, options = {}) {
        return notificationRepository.findByUserId(
            userId,
            options
        );
    }

    async getUnreadCount(userId) {
        return notificationRepository.countUnreadByUserId(
            userId
        );
    }

    async markAsRead(notificationId, userId) {
        return notificationRepository.markAsRead(
            notificationId,
            userId
        );
    }

    async markAllAsRead(userId) {
        return notificationRepository.markAllAsRead(
            userId
        );
    }

    async deleteNotification(notificationId, userId) {
        return notificationRepository.deleteById(
            notificationId,
            userId
        );
    }

    async deleteAllNotifications(userId) {
        return notificationRepository.deleteAllByUserId(
            userId
        );
    }

    async createNotificationsForUsers(userIds, notificationData) {
        const notifications = [];

        for (const userId of userIds) {
            const notification = await this.createNotification({
                userId,
                ...notificationData
            });

            notifications.push(notification);
        }

        return notifications;
    }
}

module.exports = new NotificationService();