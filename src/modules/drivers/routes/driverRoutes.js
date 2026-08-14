const express = require("express");

const router = express.Router();

const driverController = require("../controllers/driverController");
const { updateAvailabilityValidator } = require("../validators/driverValidator");

const protectMiddleware = require("../../../shared/middlewares/protectMiddleware");
const authorizeMiddleware = require("../../../shared/middlewares/authorizeMiddleware");
const validationMiddleware = require("../../../shared/middlewares/validationMiddleware");

/*
 * GET /api/drivers/me
 * Get the current authenticated user's driver profile.
 * Must be declared before /:id to avoid route shadowing.
 */
router.get(
    "/me",
    protectMiddleware,
    driverController.getMyDriver
);

/*
 * PATCH /api/drivers/me/availability
 * Update the authenticated driver's availability status.
 * Must be declared before /:id to avoid route shadowing.
 */
router.patch(
    "/me/availability",
    protectMiddleware,
    updateAvailabilityValidator,
    validationMiddleware,
    driverController.updateAvailability
);

/*
 * GET /api/drivers/:id
 * Get a specific driver by ID.
 * Admin only.
 */
router.get(
    "/:id",
    protectMiddleware,
    authorizeMiddleware("admin"),
    driverController.getDriverById
);

module.exports = router;
