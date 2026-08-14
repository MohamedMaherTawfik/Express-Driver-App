const { body } = require("express-validator");
const { DRIVER_AVAILABILITY_STATUS } = require("../constants/driverConstants");

const updateAvailabilityValidator = [
    body("availabilityStatus")
        .trim()
        .notEmpty()
        .withMessage("Availability status is required.")
        .isIn(Object.values(DRIVER_AVAILABILITY_STATUS))
        .withMessage(
            `Availability status must be one of: ${Object.values(DRIVER_AVAILABILITY_STATUS).join(", ")}`
        ),
];

module.exports = {
    updateAvailabilityValidator,
};
