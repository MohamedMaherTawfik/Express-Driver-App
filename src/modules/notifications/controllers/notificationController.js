const notificationService = require("../services/notificationService");
const asyncHandler = require("../../../shared/utils/asyncHandler");
const ApiResponse = require("../../../shared/utils/response");
const NotFoundError = require("../../../shared/errors/NotFoundError");

class NotificationController {
    getNotifications = asyncHandler(async (req, res) => {
        const userId = req.user.id;

        const page = Math.max(
            Number.parseInt(req.query.page, 10) || 1,
            1
        );

        const limit = Math.min(
            Math.max(
                Number.parseInt(req.query.limit, 10) || 20,
                1
            ),
            100
        );

        const unreadOnly =
            req.query.unreadOnly === "true";

        const result =
            await notificationService.getUserNotifications(
                userId,
                {
                    page,
                    limit,
                    unreadOnly
                }
            );

        return ApiResponse.ok(
            res,
            result,
            "Notifications fetched successfully"
        );
    });

    getUnreadCount = asyncHandler(async (req, res) => {
        const count =
            await notificationService.getUnreadCount(
                req.user.id
            );

        return ApiResponse.ok(
            res,
            { count },
            "Unread notification count fetched successfully"
        );
    });

    markAsRead = asyncHandler(async (req, res) => {
        const notification =
            await notificationService.markAsRead(
                req.params.id,
                req.user.id
            );

        if (!notification) {
            throw new NotFoundError("Notification");
        }

        return ApiResponse.ok(
            res,
            notification,
            "Notification marked as read"
        );
    });

    markAllAsRead = asyncHandler(async (req, res) => {
        const result =
            await notificationService.markAllAsRead(
                req.user.id
            );

        return ApiResponse.ok(
            res,
            { modifiedCount: result.modifiedCount },
            "All notifications marked as read"
        );
    });

    deleteNotification = asyncHandler(async (req, res) => {
        const notification =
            await notificationService.deleteNotification(
                req.params.id,
                req.user.id
            );

        if (!notification) {
            throw new NotFoundError("Notification");
        }

        return ApiResponse.ok(
            res,
            null,
            "Notification deleted successfully"
        );
    });

    deleteAllNotifications = asyncHandler(async (req, res) => {
        const result =
            await notificationService.deleteAllNotifications(
                req.user.id
            );

        return ApiResponse.ok(
            res,
            { deletedCount: result.deletedCount },
            "All notifications deleted successfully"
        );
    });
}

module.exports = new NotificationController();