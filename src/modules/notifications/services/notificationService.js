const socketService = require("../../../infrastructure/socket/socketService");
const logger = require("../../../shared/config/logger");

class NotificationService {

    sendToUser(userId, notification) {
        socketService.emitToUser(
            userId,
            "notification",
            notification
        );

        logger.info("Notification sent", {
            userId,
            type: notification.type
        });
    }
}

module.exports = new NotificationService();