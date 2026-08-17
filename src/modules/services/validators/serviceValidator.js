const { body, param } = require("express-validator");
const { SERVICE_TYPE, SERVICE_STATUS, VEHICLE_TYPE } = require("../constants/serviceConstants");

const createServiceValidator = [
    body("name")
        .trim()
        .notEmpty()
        .withMessage("Service name is required.")
        .isLength({ min: 2, max: 100 })
        .withMessage("Service name must be between 2 and 100 characters."),

    body("slug")
        .optional()
        .trim()
        .isLength({ max: 120 })
        .withMessage("Service slug cannot exceed 120 characters."),

    body("description")
        .optional()
        .trim()
        .isLength({ max: 500 })
        .withMessage("Service description cannot exceed 500 characters."),

    body("type")
        .trim()
        .notEmpty()
        .withMessage("Service type is required.")
        .isIn(Object.values(SERVICE_TYPE))
        .withMessage(`Service type must be one of: ${Object.values(SERVICE_TYPE).join(", ")}`),

    body("status")
        .optional()
        .isIn(Object.values(SERVICE_STATUS))
        .withMessage(`Service status must be one of: ${Object.values(SERVICE_STATUS).join(", ")}`),

    body("basePrice")
        .notEmpty()
        .withMessage("Base price is required.")
        .isFloat({ min: 0 })
        .withMessage("Base price must be a non-negative number."),

    body("pricePerKm")
        .optional()
        .isFloat({ min: 0 })
        .withMessage("Price per kilometer must be a non-negative number."),

    body("pricePerMinute")
        .optional()
        .isFloat({ min: 0 })
        .withMessage("Price per minute must be a non-negative number."),

    body("estimatedDurationMin")
        .optional()
        .isInt({ min: 1 })
        .withMessage("Estimated duration must be an integer of at least 1 minute."),

    body("allowedVehicleTypes")
        .optional()
        .isArray()
        .withMessage("allowedVehicleTypes must be an array.")
        .custom((types) => {
            const validTypes = Object.values(VEHICLE_TYPE);
            for (const vt of types) {
                if (!validTypes.includes(vt)) {
                    throw new Error(`Invalid vehicle type '${vt}'. Must be one of: ${validTypes.join(", ")}`);
                }
            }
            return true;
        }),

    body("isActive")
        .optional()
        .isBoolean()
        .withMessage("isActive must be a boolean."),
];

const updateServiceValidator = [
    body("name")
        .optional()
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage("Service name must be between 2 and 100 characters."),

    body("slug")
        .optional()
        .trim()
        .isLength({ max: 120 })
        .withMessage("Service slug cannot exceed 120 characters."),

    body("description")
        .optional()
        .trim()
        .isLength({ max: 500 })
        .withMessage("Service description cannot exceed 500 characters."),

    body("type")
        .optional()
        .trim()
        .isIn(Object.values(SERVICE_TYPE))
        .withMessage(`Service type must be one of: ${Object.values(SERVICE_TYPE).join(", ")}`),

    body("status")
        .optional()
        .isIn(Object.values(SERVICE_STATUS))
        .withMessage(`Service status must be one of: ${Object.values(SERVICE_STATUS).join(", ")}`),

    body("basePrice")
        .optional()
        .isFloat({ min: 0 })
        .withMessage("Base price must be a non-negative number."),

    body("pricePerKm")
        .optional()
        .isFloat({ min: 0 })
        .withMessage("Price per kilometer must be a non-negative number."),

    body("pricePerMinute")
        .optional()
        .isFloat({ min: 0 })
        .withMessage("Price per minute must be a non-negative number."),

    body("estimatedDurationMin")
        .optional()
        .isInt({ min: 1 })
        .withMessage("Estimated duration must be an integer of at least 1 minute."),

    body("allowedVehicleTypes")
        .optional()
        .isArray()
        .withMessage("allowedVehicleTypes must be an array.")
        .custom((types) => {
            const validTypes = Object.values(VEHICLE_TYPE);
            for (const vt of types) {
                if (!validTypes.includes(vt)) {
                    throw new Error(`Invalid vehicle type '${vt}'. Must be one of: ${validTypes.join(", ")}`);
                }
            }
            return true;
        }),

    body("isActive")
        .optional()
        .isBoolean()
        .withMessage("isActive must be a boolean."),
];

const getServiceByIdValidator = [
    param("id")
        .isMongoId()
        .withMessage("Service ID must be a valid ObjectId."),
];

module.exports = {
    createServiceValidator,
    updateServiceValidator,
    getServiceByIdValidator,
};
