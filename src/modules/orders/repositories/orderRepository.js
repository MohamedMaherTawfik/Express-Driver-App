const Order = require("../models/order");
const Counter = require("../models/counter");

class OrderRepository {
    /**
     * Atomically increment the order sequence counter and return the next value.
     * Uses findOneAndUpdate with $inc for concurrency safety.
     */
    async nextOrderNumber() {
        const year = new Date().getFullYear();
        const counterId = `order_${year}`;

        const counter = await Counter.findOneAndUpdate(
            { _id: counterId },
            { $inc: { seq: 1 } },
            { new: true, upsert: true }
        );

        const padded = String(counter.seq).padStart(6, "0");
        return `ORD-${year}-${padded}`;
    }

    async create(data, options = {}) {
        if (options.session) {
            const [order] = await Order.create([data], { session: options.session });
            return order;
        }
        return Order.create(data);
    }

    /**
     * Find order by ID and populate user, service, driver, vehicle references.
     */
    async findById(id) {
        return Order.findById(id)
            .populate("user", "name email")
            .populate("service", "name type slug")
            .populate({
                path: "driver",
                populate: { path: "user", select: "name email" },
            })
            .populate("vehicle", "type make model plateNumber color year");
    }

    /**
     * Find order by ID without population (for internal business checks).
     */
    async findByIdRaw(id) {
        return Order.findById(id);
    }

    /**
     * Paginated query for orders matching a filter.
     */
    async findMany({ filter = {}, sort = { createdAt: -1 }, skip = 0, limit = 10 }) {
        const items = await Order.find(filter)
            .populate("user", "name email")
            .populate("service", "name type slug")
            .populate({
                path: "driver",
                populate: { path: "user", select: "name email" },
            })
            .populate("vehicle", "type make model plateNumber")
            .sort(sort)
            .skip(skip)
            .limit(limit);

        const total = await Order.countDocuments(filter);
        return { items, total };
    }

    /** Orders belonging to a specific user. */
    async findUserOrders({ userId, filter = {}, sort, skip, limit }) {
        return this.findMany({ filter: { ...filter, user: userId }, sort, skip, limit });
    }

    /** Orders assigned to a specific driver. */
    async findDriverOrders({ driverId, filter = {}, sort, skip, limit }) {
        return this.findMany({ filter: { ...filter, driver: driverId }, sort, skip, limit });
    }

    /**
     * Atomically update status — only if current status matches expected.
     * Prevents race conditions during concurrent dispatch.
     */
    async updateStatusAtomic(id, fromStatus, toStatus, extraFields = {}, options = {}) {
        return Order.findOneAndUpdate(
            { _id: id, status: fromStatus },
            { $set: { status: toStatus, ...extraFields } },
            { new: true, session: options.session || null }
        );
    }

    async updateById(id, data, options = {}) {
        return Order.findByIdAndUpdate(id, data, {
            new: true,
            runValidators: true,
            session: options.session || null,
        });
    }

    async assignDriverAtomic(id, fromStatus, toStatus, driverId, vehicleId = null, options = {}) {
        return Order.findOneAndUpdate(
            {
                _id: id,
                status: fromStatus,
                driver: null,
                vehicle: null,
            },
            {
                $set: {
                    status: toStatus,
                    driver: driverId,
                    ...(vehicleId ? { vehicle: vehicleId } : {}),
                },
            },
            {
                new: true,
                runValidators: true,
                session: options.session || null,
            }
        );
    }

    async exists(filter) {
        return Order.exists(filter);
    }
}

module.exports = new OrderRepository();
