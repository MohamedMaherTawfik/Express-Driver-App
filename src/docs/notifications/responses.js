/**
 * @swagger
 * components:
 *   responses:
 *
 *     NotificationNotFound:
 *       description: Notification not found
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               success:
 *                 type: boolean
 *                 example: false
 *               message:
 *                 type: string
 *                 example: Notification not found
 *
 *     NotificationMarkedAsRead:
 *       description: Notification marked as read successfully
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               success:
 *                 type: boolean
 *                 example: true
 *               message:
 *                 type: string
 *                 example: Notification marked as read
 *               data:
 *                 $ref: '#/components/schemas/Notification'
 *
 *     AllNotificationsMarkedAsRead:
 *       description: All notifications marked as read successfully
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               success:
 *                 type: boolean
 *                 example: true
 *               message:
 *                 type: string
 *                 example: All notifications marked as read
 *               data:
 *                 type: object
 *                 properties:
 *                   modifiedCount:
 *                     type: integer
 *                     example: 5
 *
 *     NotificationDeleted:
 *       description: Notification deleted successfully
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               success:
 *                 type: boolean
 *                 example: true
 *               message:
 *                 type: string
 *                 example: Notification deleted successfully
 *
 *     AllNotificationsDeleted:
 *       description: All notifications deleted successfully
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               success:
 *                 type: boolean
 *                 example: true
 *               message:
 *                 type: string
 *                 example: All notifications deleted successfully
 *               data:
 *                 type: object
 *                 properties:
 *                   deletedCount:
 *                     type: integer
 *                     example: 10
 */