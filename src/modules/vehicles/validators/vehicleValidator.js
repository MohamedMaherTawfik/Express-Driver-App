const { body, param } = require("express-validator");
const { VEHICLE_TYPE, VEHICLE_STATUS } = require("../constants/vehicleConstants");

const createVehicleValidator = [
    body("type")
        .trim()
        .notEmpty()
        .withMessage("Vehicle type is required.")
        .isIn(Object.values(VEHICLE_TYPE))
        .withMessage(`Vehicle type must be one of: ${Object.values(VEHICLE_TYPE).join(", ")}`),

    body("make")
        .trim()
        .notEmpty()
        .withMessage("Vehicle make is required.")
        .isLength({ max: 100 })
        .withMessage("Vehicle make cannot exceed 100 characters."),

    body("model")
        .trim()
        .notEmpty()
        .withMessage("Vehicle model is required.")
        .isLength({ max: 100 })
        .withMessage("Vehicle model cannot exceed 100 characters."),

    body("year")
        .notEmpty()
        .withMessage("Vehicle year is required.")
        .isInt({ min: 1900, max: new Date().getFullYear() + 1 })
        .withMessage("Vehicle year must be a valid year."),

    body("color")
        .trim()
        .notEmpty()
        .withMessage("Vehicle color is required.")
        .isLength({ max: 50 })
        .withMessage("Vehicle color cannot exceed 50 characters."),

    body("plateNumber")
        .trim()
        .notEmpty()
        .withMessage("Vehicle plate number is required.")
        .isLength({ max: 50 })
        .withMessage("Vehicle plate number cannot exceed 50 characters."),

    body("registrationNumber")
        .optional()
        .trim()
        .isLength({ max: 100 })
        .withMessage("Registration number cannot exceed 100 characters."),

    body("driver")
        .optional()
        .isMongoId()
        .withMessage("Driver must be a valid ObjectId."),

    body("status")
        .optional()
        .isIn(Object.values(VEHICLE_STATUS))
        .withMessage(`Vehicle status must be one of: ${Object.values(VEHICLE_STATUS).join(", ")}`),

    body("isActive")
        .optional()
        .isBoolean()
        .withMessage("isActive must be a boolean."),
];

const updateVehicleValidator = [
    body("type")
        .optional()
        .trim()
        .isIn(Object.values(VEHICLE_TYPE))
        .withMessage(`Vehicle type must be one of: ${Object.values(VEHICLE_TYPE).join(", ")}`),

    body("make")
        .optional()
        .trim()
        .isLength({ max: 100 })
        .withMessage("Vehicle make cannot exceed 100 characters."),

    body("model")
        .optional()
        .trim()
        .isLength({ max: 100 })
        .withMessage("Vehicle model cannot exceed 100 characters."),

    body("year")
        .optional()
        .isInt({ min: 1900, max: new Date().getFullYear() + 1 })
        .withMessage("Vehicle year must be a valid year."),

    body("color")
        .optional()
        .trim()
        .isLength({ max: 50 })
        .withMessage("Vehicle color cannot exceed 50 characters."),

    body("plateNumber")
        .optional()
        .trim()
        .isLength({ max: 50 })
        .withMessage("Vehicle plate number cannot exceed 50 characters."),

    body("registrationNumber")
        .optional()
        .trim()
        .isLength({ max: 100 })
        .withMessage("Registration number cannot exceed 100 characters."),

    body("driver")
        .optional()
        .isMongoId()
        .withMessage("Driver must be a valid ObjectId."),

    body("status")
        .optional()
        .isIn(Object.values(VEHICLE_STATUS))
        .withMessage(`Vehicle status must be one of: ${Object.values(VEHICLE_STATUS).join(", ")}`),

    body("isActive")
        .optional()
        .isBoolean()
        .withMessage("isActive must be a boolean."),
];

const getVehicleByIdValidator = [
    param("id")
        .isMongoId()
        .withMessage("Vehicle ID must be a valid ObjectId."),
];

module.exports = {
    createVehicleValidator,
    updateVehicleValidator,
    getVehicleByIdValidator,
};
