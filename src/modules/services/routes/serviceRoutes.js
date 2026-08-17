const express = require("express");
const router = express.Router();

const serviceController = require("../controllers/serviceController");
const {
    createServiceValidator,
    updateServiceValidator,
    getServiceByIdValidator,
} = require("../validators/serviceValidator");

const protectMiddleware = require("../../../shared/middlewares/protectMiddleware");
const authorizeMiddleware = require("../../../shared/middlewares/authorizeMiddleware");
const validationMiddleware = require("../../../shared/middlewares/validationMiddleware");

// All service routes require authentication
router.use(protectMiddleware);

/*
 * GET /api/services
 * Get catalog of services.
 * Regular users/drivers receive only active services; admins can view/filter all.
 */
router.get(
    "/",
    serviceController.getServices
);

/*
 * GET /api/services/slug/:slug
 * Get a specific service by its unique slug.
 * Must be declared before /:id to avoid route shadowing.
 */
router.get(
    "/slug/:slug",
    serviceController.getServiceBySlug
);

/*
 * GET /api/services/:id
 * Get a specific service by ID.
 */
router.get(
    "/:id",
    getServiceByIdValidator,
    validationMiddleware,
    serviceController.getServiceById
);

/*
 * POST /api/services
 * Create a new service (Admin only).
 */
router.post(
    "/",
    authorizeMiddleware("admin"),
    createServiceValidator,
    validationMiddleware,
    serviceController.createService
);

/*
 * PATCH /api/services/:id
 * Update a service (Admin only).
 */
router.patch(
    "/:id",
    authorizeMiddleware("admin"),
    getServiceByIdValidator,
    updateServiceValidator,
    validationMiddleware,
    serviceController.updateService
);

/*
 * DELETE /api/services/:id
 * Safe delete / deactivate a service (Admin only).
 * Query parameter `?hard=true` allows hard deletion if explicitly requested.
 */
router.delete(
    "/:id",
    authorizeMiddleware("admin"),
    getServiceByIdValidator,
    validationMiddleware,
    serviceController.deleteService
);

module.exports = router;
