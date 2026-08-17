const orderRepository = require("../repositories/orderRepository");
const serviceRepository = require("../../services/repositories/serviceRepository");
const driverRepository = require("../../drivers/repositories/driverRepository");
const vehicleRepository = require("../../vehicles/repositories/vehicleRepository");
const notificationService = require("../../notifications/services/notificationService");

const {
    ORDER_STATUS,
    ORDER_STATUS_TRANSITIONS,
    USER_CANCELLABLE_STATUSES,
    TERMINAL_STATUSES,
    DRIVER_ALLOWED_TRANSITIONS,
    ORDER_NOTIFICATION_TYPES,
} = require("../constants/orderConstants");

const NotFoundError = require("../../../shared/errors/NotFoundError");
const BadRequestError = require("../../../shared/errors/BadRequestError");
const ForbiddenError = require("../../../shared/errors/ForbiddenError");

class OrderService {
    /* ─────────────────────────────────────────────────────────────────
     * CREATE ORDER
     * ───────────────────────────────────────────────────────────────── */
    async createOrder(orderData, requestingUser) {
        const { serviceId, pickup, dropoff, notes } = orderData;

        // 1. Load and validate service
        const service = await serviceRepository.findById(serviceId);
        if (!service) {
            throw new NotFoundError("Service");
        }
        if (!service.isActive || service.status !== "active") {
            throw new BadRequestError("The requested service is not currently available.");
        }

        // 2. Build service snapshot (historical integrity)
        const serviceSnapshot = {
            name: service.name,
            type: service.type,
            basePrice: service.basePrice,
            pricePerKm: service.pricePerKm || 0,
            pricePerMinute: service.pricePerMinute || 0,
            allowedVehicleTypes: service.allowedVehicleTypes || [],
        };

        // 3. Build pricing snapshot — basePrice only at creation.
        //    Dispatch/Tracking engine will recalculate distancePrice/timePrice on delivery.
        const pricing = {
            basePrice: service.basePrice,
            distancePrice: 0,
            timePrice: 0,
            serviceFee: 0,
            discount: 0,
            total: service.basePrice,
        };

        // 4. Generate unique order number atomically
        const orderNumber = await orderRepository.nextOrderNumber();

        // 5. Create order document
        const order = await orderRepository.create({
            orderNumber,
            user: requestingUser._id,
            service: service._id,
            serviceSnapshot,
            driver: null,
            vehicle: null,
            pickup,
            dropoff,
            status: ORDER_STATUS.PENDING,
            pricing,
            notes: notes || null,
        });

        // 6. Send notification (non-blocking — failure must not break order creation)
        this._notifySafely(requestingUser._id, {
            type: ORDER_NOTIFICATION_TYPES.ORDER_CREATED,
            title: "Order Placed",
            message: `Your order ${orderNumber} has been placed and is awaiting a driver.`,
            data: { orderId: order._id, orderNumber },
        });

        return order;
    }

    /* ─────────────────────────────────────────────────────────────────
     * GET ORDERS (paginated, role-scoped)
     * ───────────────────────────────────────────────────────────────── */
    async getOrders(queryParams, requestingUser, requestingDriver = null) {
        const { page = 1, limit = 10, status, sort = "createdAt" } = queryParams;
        const skip = (parseInt(page) - 1) * parseInt(limit);
        const parsedLimit = parseInt(limit);

        const sortMap = {
            createdAt: { createdAt: -1 },
            createdAt_asc: { createdAt: 1 },
            status: { status: 1, createdAt: -1 },
        };
        const sortObj = sortMap[sort] || { createdAt: -1 };

        // Build base filter from optional query params
        const baseFilter = {};
        if (status) {
            if (!Object.values(ORDER_STATUS).includes(status)) {
                throw new BadRequestError(`Invalid status filter. Must be one of: ${Object.values(ORDER_STATUS).join(", ")}`);
            }
            baseFilter.status = status;
        }

        // Scope results by role
        if (requestingUser.role === "admin") {
            return orderRepository.findMany({ filter: baseFilter, sort: sortObj, skip, limit: parsedLimit });
        }

        if (requestingDriver) {
            return orderRepository.findDriverOrders({
                driverId: requestingDriver._id,
                filter: baseFilter,
                sort: sortObj,
                skip,
                limit: parsedLimit,
            });
        }

        // Regular user — own orders only
        return orderRepository.findUserOrders({
            userId: requestingUser._id,
            filter: baseFilter,
            sort: sortObj,
            skip,
            limit: parsedLimit,
        });
    }

    /* ─────────────────────────────────────────────────────────────────
     * GET ORDER BY ID (with ownership check)
     * ───────────────────────────────────────────────────────────────── */
    async getOrderById(id, requestingUser, requestingDriver = null) {
        const order = await orderRepository.findById(id);
        if (!order) {
            throw new NotFoundError("Order");
        }

        // Admin sees everything
        if (requestingUser.role === "admin") {
            return order;
        }

        // Driver sees only their assigned orders
        if (requestingDriver) {
            const isAssigned = order.driver &&
                order.driver._id.toString() === requestingDriver._id.toString();
            if (!isAssigned) {
                throw new ForbiddenError("You are not authorized to view this order.");
            }
            return order;
        }

        // User sees only own orders
        const isOwner = order.user._id
            ? order.user._id.toString() === requestingUser._id.toString()
            : order.user.toString() === requestingUser._id.toString();

        if (!isOwner) {
            throw new ForbiddenError("You are not authorized to view this order.");
        }

        return order;
    }

    /* ─────────────────────────────────────────────────────────────────
     * CANCEL ORDER
     * ───────────────────────────────────────────────────────────────── */
    async cancelOrder(id, requestingUser, reason = null) {
        const order = await orderRepository.findByIdRaw(id);
        if (!order) {
            throw new NotFoundError("Order");
        }

        // Ownership check — user can only cancel own orders
        if (requestingUser.role !== "admin") {
            if (order.user.toString() !== requestingUser._id.toString()) {
                throw new ForbiddenError("You are not authorized to cancel this order.");
            }
        }

        // Terminal status check
        if (TERMINAL_STATUSES.includes(order.status)) {
            throw new BadRequestError(`Cannot cancel an order with status "${order.status}".`);
        }

        // User can only cancel from allowed statuses
        if (requestingUser.role !== "admin" && !USER_CANCELLABLE_STATUSES.includes(order.status)) {
            throw new BadRequestError(
                `You can only cancel an order in status: ${USER_CANCELLABLE_STATUSES.join(", ")}.`
            );
        }

        // Check valid transition
        const allowed = ORDER_STATUS_TRANSITIONS[order.status] || [];
        if (!allowed.includes(ORDER_STATUS.CANCELLED)) {
            throw new BadRequestError(`Cannot cancel order from status "${order.status}".`);
        }

        const now = new Date();
        const cancellation = {
            cancelledBy: requestingUser._id,
            cancelledByRole: requestingUser.role,
            reason: reason || null,
            cancelledAt: now,
        };

        const updated = await orderRepository.updateStatusAtomic(
            id,
            order.status,
            ORDER_STATUS.CANCELLED,
            { cancellation }
        );

        if (!updated) {
            // Concurrent modification — refetch and report current status
            const current = await orderRepository.findByIdRaw(id);
            throw new BadRequestError(
                `Order status changed concurrently. Current status: "${current?.status}". Please retry.`
            );
        }

        // Notify the order owner if cancelled by admin/driver
        if (requestingUser.role === "admin") {
            this._notifySafely(order.user, {
                type: ORDER_NOTIFICATION_TYPES.ORDER_CANCELLED,
                title: "Order Cancelled",
                message: `Your order ${order.orderNumber} has been cancelled by an administrator.`,
                data: { orderId: order._id, orderNumber: order.orderNumber, reason },
            });
        } else {
            this._notifySafely(requestingUser._id, {
                type: ORDER_NOTIFICATION_TYPES.ORDER_CANCELLED,
                title: "Order Cancelled",
                message: `Your order ${order.orderNumber} has been cancelled.`,
                data: { orderId: order._id, orderNumber: order.orderNumber, reason },
            });
        }

        return updated;
    }

    /* ─────────────────────────────────────────────────────────────────
     * UPDATE ORDER STATUS (driver / admin)
     * ───────────────────────────────────────────────────────────────── */
    async updateOrderStatus(id, newStatus, requestingUser, requestingDriver = null) {
        if (!Object.values(ORDER_STATUS).includes(newStatus)) {
            throw new BadRequestError(`Invalid status "${newStatus}".`);
        }

        const order = await orderRepository.findByIdRaw(id);
        if (!order) {
            throw new NotFoundError("Order");
        }

        // Check current status is not terminal
        if (TERMINAL_STATUSES.includes(order.status)) {
            throw new BadRequestError(`Cannot update status of an order that is already "${order.status}".`);
        }

        // Validate the transition is allowed globally
        const allowed = ORDER_STATUS_TRANSITIONS[order.status] || [];
        if (!allowed.includes(newStatus)) {
            throw new BadRequestError(
                `Invalid status transition from "${order.status}" to "${newStatus}".`
            );
        }

        if (requestingUser.role !== "admin") {
            // Driver authorization
            if (!requestingDriver) {
                throw new ForbiddenError("Only drivers or admins can update order status.");
            }

            // Driver must be assigned to this order
            if (!order.driver || order.driver.toString() !== requestingDriver._id.toString()) {
                throw new ForbiddenError("You are not the assigned driver for this order.");
            }

            // Driver can only trigger their allowed transitions
            const driverNext = DRIVER_ALLOWED_TRANSITIONS[order.status];
            if (driverNext !== newStatus) {
                throw new ForbiddenError(
                    `Drivers can only transition from "${order.status}" to "${driverNext}".`
                );
            }
        }

        const updated = await orderRepository.updateStatusAtomic(
            id,
            order.status,
            newStatus
        );

        if (!updated) {
            const current = await orderRepository.findByIdRaw(id);
            throw new BadRequestError(
                `Order status changed concurrently. Current status: "${current?.status}". Please retry.`
            );
        }

        // Send notifications for key lifecycle events
        this._handleStatusNotification(order, newStatus);

        return updated;
    }

    /* ─────────────────────────────────────────────────────────────────
     * ASSIGN DRIVER (validation — actual assignment by Dispatch Module)
     * ───────────────────────────────────────────────────────────────── */
    async assignDriver(orderId, driverId, vehicleId = null) {
        const order = await orderRepository.findByIdRaw(orderId);
        if (!order) throw new NotFoundError("Order");

        if (order.status !== ORDER_STATUS.SEARCHING_DRIVER) {
            throw new BadRequestError("Driver can only be assigned when order is in SEARCHING_DRIVER status.");
        }

        // Validate driver exists and is active
        const driver = await driverRepository.findById(driverId);
        if (!driver) throw new NotFoundError("Driver");
        if (driver.status !== "active") {
            throw new BadRequestError("Driver is not active.");
        }

        // Validate vehicle if provided
        if (vehicleId) {
            await this._validateVehicleForOrder(vehicleId, driverId, order);
        }

        // Atomically assign driver and advance status.
        let updated;
        try {
            updated = await orderRepository.assignDriverAtomic(
                orderId,
                ORDER_STATUS.SEARCHING_DRIVER,
                ORDER_STATUS.DRIVER_ASSIGNED,
                driverId,
                vehicleId
            );
        } catch (err) {
            if (err && err.code === 11000) {
                throw new BadRequestError("Driver already has an active order.");
            }
            throw err;
        }

        if (!updated) {
            throw new BadRequestError("Order is already assigned or was updated concurrently. Please retry.");
        }

        // Notify customer
        this._notifySafely(order.user, {
            type: ORDER_NOTIFICATION_TYPES.DRIVER_ASSIGNED,
            title: "Driver Assigned",
            message: `A driver has been assigned to your order ${order.orderNumber}.`,
            data: { orderId: order._id, orderNumber: order.orderNumber, driverId },
        });

        return updated;
    }

    /* ─────────────────────────────────────────────────────────────────
     * INTERNAL HELPERS
     * ───────────────────────────────────────────────────────────────── */

    /**
     * Validate vehicle ownership and service compatibility.
     * Used by assignDriver and can be used by future Dispatch module.
     */
    async _validateVehicleForOrder(vehicleId, driverId, order) {
        const vehicle = await vehicleRepository.findById(vehicleId);
        if (!vehicle) throw new NotFoundError("Vehicle");
        if (!vehicle.isActive || vehicle.status !== "active") {
            throw new BadRequestError("Vehicle is not active.");
        }

        // Vehicle must belong to the assigned driver
        const vehicleDriverId = vehicle.driver?._id
            ? vehicle.driver._id.toString()
            : vehicle.driver?.toString();

        if (vehicleDriverId !== driverId.toString()) {
            throw new BadRequestError("Vehicle does not belong to the assigned driver.");
        }

        // Check vehicle type compatibility with service
        const allowedTypes = order.serviceSnapshot?.allowedVehicleTypes || [];
        if (allowedTypes.length > 0 && !allowedTypes.includes(vehicle.type)) {
            throw new BadRequestError(
                `Vehicle type "${vehicle.type}" is not compatible with this service. ` +
                `Allowed types: ${allowedTypes.join(", ")}.`
            );
        }
    }

    /**
     * Dispatch status-specific notifications without blocking the main flow.
     */
    _handleStatusNotification(order, newStatus) {
        const notifMap = {
            [ORDER_STATUS.DRIVER_ARRIVING]: {
                type: ORDER_NOTIFICATION_TYPES.DRIVER_ARRIVING,
                title: "Driver on the Way",
                message: `Your driver is heading to the pickup location for order ${order.orderNumber}.`,
            },
            [ORDER_STATUS.DRIVER_ARRIVED]: {
                type: ORDER_NOTIFICATION_TYPES.DRIVER_ARRIVED,
                title: "Driver Arrived",
                message: `Your driver has arrived at the pickup location for order ${order.orderNumber}.`,
            },
            [ORDER_STATUS.PICKED_UP]: {
                type: ORDER_NOTIFICATION_TYPES.ORDER_PICKED_UP,
                title: "Order Picked Up",
                message: `Your order ${order.orderNumber} has been picked up and is on its way.`,
            },
            [ORDER_STATUS.IN_TRANSIT]: {
                type: ORDER_NOTIFICATION_TYPES.ORDER_IN_TRANSIT,
                title: "Order In Transit",
                message: `Your order ${order.orderNumber} is now in transit.`,
            },
            [ORDER_STATUS.DELIVERED]: {
                type: ORDER_NOTIFICATION_TYPES.ORDER_DELIVERED,
                title: "Order Delivered",
                message: `Your order ${order.orderNumber} has been delivered successfully.`,
            },
            [ORDER_STATUS.FAILED]: {
                type: ORDER_NOTIFICATION_TYPES.ORDER_FAILED,
                title: "Order Failed",
                message: `Your order ${order.orderNumber} could not be completed.`,
            },
        };

        const notif = notifMap[newStatus];
        if (notif) {
            this._notifySafely(order.user, {
                ...notif,
                data: { orderId: order._id, orderNumber: order.orderNumber },
            });
        }
    }

    /**
     * Fire-and-forget notification. Failure is logged but never bubbles up.
     */
    _notifySafely(userId, notifData) {
        notificationService
            .createNotification({ userId, ...notifData })
            .catch((err) => {
                console.warn("[OrderService] Notification failed:", err.message);
            });
    }
}

module.exports = new OrderService();
