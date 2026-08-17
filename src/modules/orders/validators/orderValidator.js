const { body, param, query } = require("express-validator");
const { ORDER_STATUS } = require("../constants/orderConstants");

/* ─── Create Order ──────────────────────────────────────────────── */
const createOrderValidator = [
    body("serviceId")
        .notEmpty()
        .withMessage("Service ID is required.")
        .isMongoId()
        .withMessage("Service ID must be a valid ObjectId."),

    // Pickup
    body("pickup")
        .notEmpty()
        .withMessage("Pickup information is required."),

    body("pickup.address")
        .trim()
        .notEmpty()
        .withMessage("Pickup address is required.")
        .isLength({ max: 500 })
        .withMessage("Pickup address cannot exceed 500 characters."),

    body("pickup.latitude")
        .notEmpty()
        .withMessage("Pickup latitude is required.")
        .isFloat({ min: -90, max: 90 })
        .withMessage("Pickup latitude must be between -90 and 90."),

    body("pickup.longitude")
        .notEmpty()
        .withMessage("Pickup longitude is required.")
        .isFloat({ min: -180, max: 180 })
        .withMessage("Pickup longitude must be between -180 and 180."),

    body("pickup.contactName")
        .optional({ nullable: true })
        .trim()
        .isLength({ max: 100 })
        .withMessage("Pickup contact name cannot exceed 100 characters."),

    body("pickup.contactPhone")
        .optional({ nullable: true })
        .trim()
        .isLength({ max: 30 })
        .withMessage("Pickup contact phone cannot exceed 30 characters."),

    // Dropoff
    body("dropoff")
        .notEmpty()
        .withMessage("Dropoff information is required."),

    body("dropoff.address")
        .trim()
        .notEmpty()
        .withMessage("Dropoff address is required.")
        .isLength({ max: 500 })
        .withMessage("Dropoff address cannot exceed 500 characters."),

    body("dropoff.latitude")
        .notEmpty()
        .withMessage("Dropoff latitude is required.")
        .isFloat({ min: -90, max: 90 })
        .withMessage("Dropoff latitude must be between -90 and 90."),

    body("dropoff.longitude")
        .notEmpty()
        .withMessage("Dropoff longitude is required.")
        .isFloat({ min: -180, max: 180 })
        .withMessage("Dropoff longitude must be between -180 and 180."),

    body("dropoff.contactName")
        .optional({ nullable: true })
        .trim()
        .isLength({ max: 100 })
        .withMessage("Dropoff contact name cannot exceed 100 characters."),

    body("dropoff.contactPhone")
        .optional({ nullable: true })
        .trim()
        .isLength({ max: 30 })
        .withMessage("Dropoff contact phone cannot exceed 30 characters."),

    // Notes
    body("notes")
        .optional({ nullable: true })
        .trim()
        .isLength({ max: 1000 })
        .withMessage("Notes cannot exceed 1000 characters."),

    // Deny protected fields (mass-assignment protection)
    body("user").not().exists().withMessage("Field 'user' is not allowed."),
    body("driver").not().exists().withMessage("Field 'driver' is not allowed."),
    body("vehicle").not().exists().withMessage("Field 'vehicle' is not allowed."),
    body("status").not().exists().withMessage("Field 'status' is not allowed."),
    body("pricing").not().exists().withMessage("Field 'pricing' is not allowed."),
    body("serviceSnapshot").not().exists().withMessage("Field 'serviceSnapshot' is not allowed."),
    body("cancellation").not().exists().withMessage("Field 'cancellation' is not allowed."),
    body("orderNumber").not().exists().withMessage("Field 'orderNumber' is not allowed."),
    body("paymentStatus").not().exists().withMessage("Field 'paymentStatus' is not allowed."),
    body("paymentId").not().exists().withMessage("Field 'paymentId' is not allowed."),
];

/* ─── Order ID param ────────────────────────────────────────────── */
const orderIdValidator = [
    param("id")
        .isMongoId()
        .withMessage("Order ID must be a valid ObjectId."),
];

/* ─── Cancel Order ──────────────────────────────────────────────── */
const cancelOrderValidator = [
    ...orderIdValidator,
    body("reason")
        .optional({ nullable: true })
        .trim()
        .isLength({ max: 500 })
        .withMessage("Cancellation reason cannot exceed 500 characters."),
];

/* ─── Update Status ─────────────────────────────────────────────── */
const updateStatusValidator = [
    ...orderIdValidator,
    body("status")
        .notEmpty()
        .withMessage("Status is required.")
        .isIn(Object.values(ORDER_STATUS))
        .withMessage(`Status must be one of: ${Object.values(ORDER_STATUS).join(", ")}.`),
];

/* ─── Assign Driver (admin) ─────────────────────────────────────── */
const assignDriverValidator = [
    ...orderIdValidator,
    body("driverId")
        .notEmpty()
        .withMessage("Driver ID is required.")
        .isMongoId()
        .withMessage("Driver ID must be a valid ObjectId."),
    body("vehicleId")
        .optional({ nullable: true })
        .isMongoId()
        .withMessage("Vehicle ID must be a valid ObjectId."),
];

/* ─── Query validators ──────────────────────────────────────────── */
const getOrdersValidator = [
    query("page")
        .optional()
        .isInt({ min: 1 })
        .withMessage("Page must be a positive integer."),
    query("limit")
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage("Limit must be between 1 and 100."),
    query("status")
        .optional()
        .isIn(Object.values(ORDER_STATUS))
        .withMessage(`Status must be one of: ${Object.values(ORDER_STATUS).join(", ")}.`),
];

module.exports = {
    createOrderValidator,
    orderIdValidator,
    cancelOrderValidator,
    updateStatusValidator,
    assignDriverValidator,
    getOrdersValidator,
};
