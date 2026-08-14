const { body } = require("express-validator");
const { VEHICLE_TYPE } = require("../constant/driverApplicationConstants");

const createDriverApplicationValidator = [
    body("licenseNumber")
        .trim()
        .notEmpty()
        .withMessage("License number is required."),

    body("licenseExpiry")
        .notEmpty()
        .withMessage("License expiry is required.")
        .isISO8601()
        .withMessage("License expiry must be a valid ISO 8601 date."),

    body("vehicle.type")
        .trim()
        .notEmpty()
        .withMessage("Vehicle type is required.")
        .isIn(Object.values(VEHICLE_TYPE))
        .withMessage(
            `Vehicle type must be one of: ${Object.values(VEHICLE_TYPE).join(", ")}`
        ),

    body("vehicle.make")
        .trim()
        .notEmpty()
        .withMessage("Vehicle make is required.")
        .isLength({ max: 100 })
        .withMessage("Vehicle make cannot exceed 100 characters."),

    body("vehicle.model")
        .trim()
        .notEmpty()
        .withMessage("Vehicle model is required.")
        .isLength({ max: 100 })
        .withMessage("Vehicle model cannot exceed 100 characters."),

    body("vehicle.year")
        .notEmpty()
        .withMessage("Vehicle year is required.")
        .isInt({ min: 1900, max: new Date().getFullYear() + 1 })
        .withMessage("Vehicle year must be a valid year."),

    body("vehicle.color")
        .trim()
        .notEmpty()
        .withMessage("Vehicle color is required.")
        .isLength({ max: 50 })
        .withMessage("Vehicle color cannot exceed 50 characters."),

    body("vehicle.plateNumber")
        .trim()
        .notEmpty()
        .withMessage("Vehicle plate number is required.")
        .isLength({ max: 50 })
        .withMessage("Vehicle plate number cannot exceed 50 characters."),
];

const rejectApplicationValidator = [
    body("rejectionReason")
        .trim()
        .notEmpty()
        .withMessage("Rejection reason is required.")
        .isLength({ max: 1000 })
        .withMessage("Rejection reason cannot exceed 1000 characters."),
];

module.exports = {
    createDriverApplicationValidator,
    rejectApplicationValidator,
};
