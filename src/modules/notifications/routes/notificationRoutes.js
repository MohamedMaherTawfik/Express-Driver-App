const express = require("express");

const notificationController = require("../controllers/notificationController");
const protect = require("../../../shared/middlewares/protectMiddleware");
const {
    getNotificationsValidator,
    notificationIdValidator
} = require("../validators/notificationValidator");

const validationMiddleware = require(
    "../../../shared/middlewares/validationMiddleware"
);
const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Notifications
 *   description: User notification management
 */

/**
 * @swagger
 * /api/notifications:
 *   get:
 *     summary: Get current user's notifications
 *     description: Returns paginated notifications belonging to the authenticated user.
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         required: false
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         required: false
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *         description: Number of notifications per page
 *       - in: query
 *         name: unreadOnly
 *         required: false
 *         schema:
 *           type: boolean
 *           default: false
 *         description: Return only unread notifications
 *     responses:
 *       200:
 *         description: Notifications retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/NotificationListResponse'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get(
    "/",
    protect,
    getNotificationsValidator,
    validationMiddleware,
    notificationController.getNotifications
);

/**
 * @swagger
 * /api/notifications/unread-count:
 *   get:
 *     summary: Get unread notifications count
 *     description: Returns the number of unread notifications for the authenticated user.
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Unread notifications count retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UnreadNotificationCountResponse'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get(
    "/unread-count",
    protect,
    notificationController.getUnreadCount
);

/**
 * @swagger
 * /api/notifications/{id}/read:
 *   patch:
 *     summary: Mark notification as read
 *     description: Marks a specific notification belonging to the authenticated user as read.
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Notification ID
 *         schema:
 *           type: string
 *           example: 665c8b5e8f1a2b3c4d5e6f70
 *     responses:
 *       200:
 *         description: Notification marked as read successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Notification marked as read
 *                 data:
 *                   $ref: '#/components/schemas/Notification'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         description: Notification not found
 */
router.patch(
    "/:id/read",
    protect,
    notificationIdValidator,
    validationMiddleware,
    notificationController.markAsRead
);

/**
 * @swagger
 * /api/notifications/read-all:
 *   patch:
 *     summary: Mark all notifications as read
 *     description: Marks all unread notifications belonging to the authenticated user as read.
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: All notifications marked as read successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: All notifications marked as read
 *                 data:
 *                   type: object
 *                   properties:
 *                     modifiedCount:
 *                       type: integer
 *                       example: 5
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.patch(
    "/read-all",
    protect,
    notificationController.markAllAsRead
);

/**
 * @swagger
 * /api/notifications/{id}:
 *   delete:
 *     summary: Delete a notification
 *     description: Deletes a specific notification belonging to the authenticated user.
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Notification ID
 *         schema:
 *           type: string
 *           example: 665c8b5e8f1a2b3c4d5e6f70
 *     responses:
 *       200:
 *         description: Notification deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Notification deleted successfully
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         description: Notification not found
 */
router.delete(
    "/:id",
    protect,
    notificationIdValidator,
    validationMiddleware,
    notificationController.deleteNotification
);

/**
 * @swagger
 * /api/notifications:
 *   delete:
 *     summary: Delete all notifications
 *     description: Deletes all notifications belonging to the authenticated user.
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: All notifications deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: All notifications deleted successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     deletedCount:
 *                       type: integer
 *                       example: 10
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.delete(
    "/",
    protect,
    notificationController.deleteAllNotifications
);


module.exports = router;