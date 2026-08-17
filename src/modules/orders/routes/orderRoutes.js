const express = require("express");
const router = express.Router();

const orderController = require("../controllers/orderController");
const dispatchController = require("../../dispatch/controllers/dispatchController");
const {
    createOrderValidator,
    orderIdValidator,
    cancelOrderValidator,
    updateStatusValidator,
    assignDriverValidator,
    getOrdersValidator,
} = require("../validators/orderValidator");
const {
    orderDispatchValidator,
} = require("../../dispatch/validators/dispatchValidator");

const protectMiddleware = require("../../../shared/middlewares/protectMiddleware");
const authorizeMiddleware = require("../../../shared/middlewares/authorizeMiddleware");
const requireDriverMiddleware = require("../../../shared/middlewares/requireDriverMiddleware");
const validationMiddleware = require("../../../shared/middlewares/validationMiddleware");

// All order routes require authentication
router.use(protectMiddleware);

/*
 * POST /api/orders
 * Create a new order (authenticated user or admin).
 * User is taken from req.user — client cannot supply userId.
 */
router.post(
    "/",
    authorizeMiddleware("user", "admin"),
    createOrderValidator,
    validationMiddleware,
    orderController.createOrder
);

/*
 * GET /api/orders
 * List orders — scoped by role:
 *   user  → own orders only
 *   driver → assigned orders only (resolved via requireDriver on their call)
 *   admin → all orders
 *
 * Drivers call this endpoint too, so we conditionally attach driver context
 * without hard-blocking non-drivers.
 */
router.get(
    "/",
    getOrdersValidator,
    validationMiddleware,
    async (req, res, next) => {
        // If user is not admin, attempt to resolve driver context (non-blocking)
        if (req.user.role !== "admin") {
            const driverRepository = require("../../drivers/repositories/driverRepository");
            try {
                const driver = await driverRepository.findByUserId(req.user._id);
                if (driver && driver.status === "active") {
                    req.driver = driver;
                }
            } catch (_) {
                // Not a driver — continue as user
            }
        }
        next();
    },
    orderController.getOrders
);

/*
 * GET /api/orders/:id
 * Get a specific order by ID.
 * Access: user (own), driver (assigned), admin (any).
 */
router.get(
    "/:id",
    orderIdValidator,
    validationMiddleware,
    async (req, res, next) => {
        if (req.user.role !== "admin") {
            const driverRepository = require("../../drivers/repositories/driverRepository");
            try {
                const driver = await driverRepository.findByUserId(req.user._id);
                if (driver && driver.status === "active") {
                    req.driver = driver;
                }
            } catch (_) {
                // Not a driver — continue as user
            }
        }
        next();
    },
    orderController.getOrderById
);

/*
 * PATCH /api/orders/:id/cancel
 * Cancel an order.
 * User: can cancel own orders from allowed statuses.
 * Admin: can cancel any order from any non-terminal status.
 */
router.patch(
    "/:id/cancel",
    authorizeMiddleware("user", "admin"),
    cancelOrderValidator,
    validationMiddleware,
    orderController.cancelOrder
);

/*
 * PATCH /api/orders/:id/status
 * Update order status.
 * Driver: can advance their assigned order through driver-allowed transitions.
 * Admin: can perform any valid transition.
 */
router.patch(
    "/:id/status",
    updateStatusValidator,
    validationMiddleware,
    async (req, res, next) => {
        // Admin bypasses driver requirement
        if (req.user.role === "admin") return next();

        // For non-admins, resolve driver context
        const requireDriver = require("../../../shared/middlewares/requireDriverMiddleware");
        return requireDriver(req, res, next);
    },
    orderController.updateOrderStatus
);

/*
 * POST /api/orders/:id/assign-driver
 * Assign a driver (and optionally a vehicle) to an order.
 * Admin only — Dispatch module will automate this later.
 */
router.post(
    "/:id/assign-driver",
    authorizeMiddleware("admin"),
    assignDriverValidator,
    validationMiddleware,
    orderController.assignDriver
);

/*
 * POST /api/orders/:id/dispatch
 * Admin manually starts the dispatch domain flow for an order.
 */
router.post(
    "/:id/dispatch",
    authorizeMiddleware("admin"),
    orderDispatchValidator,
    validationMiddleware,
    dispatchController.startDispatch
);

/*
 * POST /api/orders/:id/dispatch/retry
 * Admin manually retries dispatch for an order.
 */
router.post(
    "/:id/dispatch/retry",
    authorizeMiddleware("admin"),
    orderDispatchValidator,
    validationMiddleware,
    dispatchController.retryDispatch
);

module.exports = router;
