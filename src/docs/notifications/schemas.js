/**
 * @swagger
 * components:
 *   schemas:
 *
 *     Notification:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           example: 665c8b5e8f1a2b3c4d5e6f70
 *         user:
 *           type: string
 *           example: 665c8a9e8f1a2b3c4d5e6f60
 *         type:
 *           type: string
 *           example: order_created
 *         title:
 *           type: string
 *           example: New Order
 *         message:
 *           type: string
 *           example: Your order has been created successfully.
 *         data:
 *           type: object
 *           additionalProperties: true
 *           example:
 *             orderId: 12345
 *             status: pending
 *         readAt:
 *           type: string
 *           format: date-time
 *           nullable: true
 *           example: null
 *         createdAt:
 *           type: string
 *           format: date-time
 *           example: 2026-08-11T10:30:00.000Z
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           example: 2026-08-11T10:30:00.000Z
 *
 *     NotificationPagination:
 *       type: object
 *       properties:
 *         notifications:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Notification'
 *         total:
 *           type: integer
 *           example: 35
 *         page:
 *           type: integer
 *           example: 1
 *         limit:
 *           type: integer
 *           example: 20
 *         totalPages:
 *           type: integer
 *           example: 2
 *
 *     NotificationListResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         data:
 *           $ref: '#/components/schemas/NotificationPagination'
 *
 *     UnreadNotificationCountResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         data:
 *           type: object
 *           properties:
 *             count:
 *               type: integer
 *               example: 5
 */