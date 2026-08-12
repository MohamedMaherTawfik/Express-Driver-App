const { query, param } = require("express-validator");

/**
 * Get notifications
 */
const getNotificationsValidator = [
    query("page")
        .optional()
        .isInt({ min: 1 })
        .withMessage("Page must be a positive integer")
        .toInt(),

    query("limit")
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage("Limit must be between 1 and 100")
        .toInt(),

    query("unreadOnly")
        .optional()
        .isBoolean()
        .withMessage("unreadOnly must be a boolean")
        .toBoolean()
];

/**
 * Notification ID
 */
const notificationIdValidator = [
    param("id")
        .isMongoId()
        .withMessage("Invalid notification ID")
];

module.exports = {
    getNotificationsValidator,
    notificationIdValidator
};