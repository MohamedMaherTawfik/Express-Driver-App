const orderService = require("../services/orderService");
const ApiResponse = require("../../../shared/utils/response");

class OrderController {
    async createOrder(req, res, next) {
        try {
            const order = await orderService.createOrder(req.body, req.user);
            return ApiResponse.created(res, order, "Order created successfully.");
        } catch (error) {
            next(error);
        }
    }

    async getOrders(req, res, next) {
        try {
            const { page = 1, limit = 10 } = req.query;
            const { items, total } = await orderService.getOrders(
                req.query,
                req.user,
                req.driver || null
            );
            return ApiResponse.ok(res, items, undefined, {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                pages: Math.ceil(total / parseInt(limit)),
            });
        } catch (error) {
            next(error);
        }
    }

    async getOrderById(req, res, next) {
        try {
            const order = await orderService.getOrderById(
                req.params.id,
                req.user,
                req.driver || null
            );
            return ApiResponse.ok(res, order);
        } catch (error) {
            next(error);
        }
    }

    async cancelOrder(req, res, next) {
        try {
            const order = await orderService.cancelOrder(
                req.params.id,
                req.user,
                req.body.reason || null
            );
            return ApiResponse.ok(res, order, "Order cancelled successfully.");
        } catch (error) {
            next(error);
        }
    }

    async updateOrderStatus(req, res, next) {
        try {
            const order = await orderService.updateOrderStatus(
                req.params.id,
                req.body.status,
                req.user,
                req.driver || null
            );
            return ApiResponse.ok(res, order, "Order status updated successfully.");
        } catch (error) {
            next(error);
        }
    }

    async assignDriver(req, res, next) {
        try {
            const order = await orderService.assignDriver(
                req.params.id,
                req.body.driverId,
                req.body.vehicleId || null
            );
            return ApiResponse.ok(res, order, "Driver assigned successfully.");
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new OrderController();
