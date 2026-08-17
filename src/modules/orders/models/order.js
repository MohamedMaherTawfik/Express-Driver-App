const mongoose = require("mongoose");
const {
    ORDER_STATUS,
    ORDER_PAYMENT_STATUS,
} = require("../constants/orderConstants");

/* ─── Sub-schemas ────────────────────────────────────────────────── */

const locationSchema = new mongoose.Schema(
    {
        address: {
            type: String,
            required: [true, "Address is required."],
            trim: true,
            maxlength: [500, "Address cannot exceed 500 characters."],
        },
        latitude: {
            type: Number,
            required: [true, "Latitude is required."],
            min: [-90, "Latitude must be between -90 and 90."],
            max: [90, "Latitude must be between -90 and 90."],
        },
        longitude: {
            type: Number,
            required: [true, "Longitude is required."],
            min: [-180, "Longitude must be between -180 and 180."],
            max: [180, "Longitude must be between -180 and 180."],
        },
        contactName: {
            type: String,
            trim: true,
            maxlength: [100, "Contact name cannot exceed 100 characters."],
            default: null,
        },
        contactPhone: {
            type: String,
            trim: true,
            maxlength: [30, "Contact phone cannot exceed 30 characters."],
            default: null,
        },
    },
    { _id: false }
);

const serviceSnapshotSchema = new mongoose.Schema(
    {
        name: { type: String, required: true },
        type: { type: String, required: true },
        basePrice: { type: Number, required: true },
        pricePerKm: { type: Number, default: 0 },
        pricePerMinute: { type: Number, default: 0 },
        allowedVehicleTypes: { type: [String], default: [] },
    },
    { _id: false }
);

const pricingSchema = new mongoose.Schema(
    {
        /**
         * Snapshot of service base price at time of order creation.
         * Immutable after creation.
         */
        basePrice: { type: Number, required: true, min: 0 },
        /**
         * Filled by Dispatch/Tracking engine on DELIVERED.
         * Reserved: 0 at creation.
         */
        distancePrice: { type: Number, default: 0, min: 0 },
        /**
         * Filled by Dispatch/Tracking engine on DELIVERED.
         * Reserved: 0 at creation.
         */
        timePrice: { type: Number, default: 0, min: 0 },
        /** Platform fee — future Payments Module. */
        serviceFee: { type: Number, default: 0, min: 0 },
        /** Discount/coupon — future Promotions Module. */
        discount: { type: Number, default: 0, min: 0 },
        /**
         * Running total. Set at creation = basePrice.
         * Updated by Dispatch/Payments engine on final settlement.
         */
        total: { type: Number, required: true, min: 0 },
    },
    { _id: false }
);

const cancellationSchema = new mongoose.Schema(
    {
        cancelledBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        cancelledByRole: {
            type: String,
            enum: ["user", "driver", "admin"],
            required: true,
        },
        reason: {
            type: String,
            trim: true,
            maxlength: [500, "Cancellation reason cannot exceed 500 characters."],
            default: null,
        },
        cancelledAt: {
            type: Date,
            required: true,
        },
    },
    { _id: false }
);

/* ─── Main Order Schema ──────────────────────────────────────────── */

const orderSchema = new mongoose.Schema(
    {
        /**
         * Human-readable order number. Generated atomically via Counter.
         * Format: ORD-YYYY-NNNNNN
         */
        orderNumber: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            index: true,
        },

        /** The customer who placed the order. */
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },

        /** Reference to the service used. Preserved for relationship queries. */
        service: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Service",
            required: true,
            index: true,
        },

        /**
         * Historical snapshot of service data at order creation time.
         * Ensures old orders are unaffected by admin service edits.
         */
        serviceSnapshot: {
            type: serviceSnapshotSchema,
            required: true,
        },

        /** Assigned driver. Null until Dispatch assigns one. */
        driver: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Driver",
            default: null,
        },

        /** Assigned vehicle. Null until Dispatch assigns one. */
        vehicle: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Vehicle",
            default: null,
        },

        pickup: {
            type: locationSchema,
            required: [true, "Pickup information is required."],
        },

        dropoff: {
            type: locationSchema,
            required: [true, "Dropoff information is required."],
        },

        status: {
            type: String,
            enum: {
                values: Object.values(ORDER_STATUS),
                message: `Order status must be one of: ${Object.values(ORDER_STATUS).join(", ")}`,
            },
            default: ORDER_STATUS.PENDING,
            required: true,
        },

        pricing: {
            type: pricingSchema,
            required: true,
        },

        cancellation: {
            type: cancellationSchema,
            default: null,
        },

        /**
         * Future Payments Module hook.
         * paymentStatus tracks whether the order payment has been settled.
         */
        paymentStatus: {
            type: String,
            enum: Object.values(ORDER_PAYMENT_STATUS),
            default: ORDER_PAYMENT_STATUS.PENDING,
        },

        /**
         * Foreign key for a future Payment document.
         * Null until the Payments Module is built.
         */
        paymentId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Payment",
            default: null,
        },

        /** Optional human-readable notes from the customer. */
        notes: {
            type: String,
            trim: true,
            maxlength: [1000, "Notes cannot exceed 1000 characters."],
            default: null,
        },
    },
    {
        timestamps: true,
    }
);

/* ─── Indexes ────────────────────────────────────────────────────── */

// User's order history (most recent first)
orderSchema.index({ user: 1, createdAt: -1 });

// Driver's active/assigned orders
orderSchema.index({ driver: 1, status: 1 });

// A driver can only have one active order at a time.
orderSchema.index(
    { driver: 1 },
    {
        unique: true,
        partialFilterExpression: {
            driver: { $exists: true, $ne: null },
            status: {
                $in: [
                    ORDER_STATUS.DRIVER_ASSIGNED,
                    ORDER_STATUS.DRIVER_ARRIVING,
                    ORDER_STATUS.DRIVER_ARRIVED,
                    ORDER_STATUS.PICKED_UP,
                    ORDER_STATUS.IN_TRANSIT,
                ],
            },
        },
    }
);

// Admin/Dispatch status filtering
orderSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model("Order", orderSchema);
