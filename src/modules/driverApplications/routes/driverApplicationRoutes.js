const express = require("express");

const router = express.Router();

const driverApplicationController = require("../controllers/driverApplicationController");
const {
    createDriverApplicationValidator,
    rejectApplicationValidator,
} = require("../validators/driverApplicationValidator");

const protectMiddleware = require("../../../shared/middlewares/protectMiddleware");
const authorizeMiddleware = require("../../../shared/middlewares/authorizeMiddleware");
const validationMiddleware = require("../../../shared/middlewares/validationMiddleware");

/*
 * POST /api/driver-applications
 * Submit a new driver application.
 * Any authenticated user can apply.
 */
router.post(
    "/",
    protectMiddleware,
    createDriverApplicationValidator,
    validationMiddleware,
    driverApplicationController.createApplication
);

/*
 * GET /api/driver-applications/me
 * Get all applications for the currently authenticated user.
 * Must be declared before /:id to avoid route shadowing.
 */
router.get(
    "/me",
    protectMiddleware,
    driverApplicationController.getMyApplications
);

/*
 * GET /api/driver-applications/:id
 * Get a specific application by ID.
 * Admin only.
 */
router.get(
    "/:id",
    protectMiddleware,
    authorizeMiddleware("admin"),
    driverApplicationController.getApplication
);

/*
 * POST /api/driver-applications/:id/reject
 * Admin rejects a pending application.
 */
router.post(
    "/:id/reject",
    protectMiddleware,
    authorizeMiddleware("admin"),
    rejectApplicationValidator,
    validationMiddleware,
    driverApplicationController.rejectApplication
);

/*
 * POST /api/driver-applications/:id/approve
 * Admin approves a pending application.
 * Atomically creates the Driver entity.
 */
router.post(
    "/:id/approve",
    protectMiddleware,
    authorizeMiddleware("admin"),
    driverApplicationController.approveApplication
);

module.exports = router;
