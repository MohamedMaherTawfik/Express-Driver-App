const mongoose = require("mongoose");
const { SERVICE_TYPE, SERVICE_STATUS, VEHICLE_TYPE } = require("../constants/serviceConstants");

const serviceSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, "Service name is required."],
            trim: true,
            minlength: [2, "Service name must be at least 2 characters."],
            maxlength: [100, "Service name cannot exceed 100 characters."],
        },
        slug: {
            type: String,
            required: [true, "Service slug is required."],
            unique: true,
            trim: true,
            lowercase: true,
            maxlength: [120, "Service slug cannot exceed 120 characters."],
        },
        description: {
            type: String,
            trim: true,
            maxlength: [500, "Service description cannot exceed 500 characters."],
            default: "",
        },
        type: {
            type: String,
            enum: {
                values: Object.values(SERVICE_TYPE),
                message: `Service type must be one of: ${Object.values(SERVICE_TYPE).join(", ")}`,
            },
            required: [true, "Service type is required."],
        },
        status: {
            type: String,
            enum: {
                values: Object.values(SERVICE_STATUS),
                message: `Service status must be one of: ${Object.values(SERVICE_STATUS).join(", ")}`,
            },
            default: SERVICE_STATUS.ACTIVE,
            required: true,
        },
        basePrice: {
            type: Number,
            required: [true, "Base price is required."],
            min: [0, "Base price cannot be negative."],
        },
        pricePerKm: {
            type: Number,
            min: [0, "Price per kilometer cannot be negative."],
            default: 0,
        },
        pricePerMinute: {
            type: Number,
            min: [0, "Price per minute cannot be negative."],
            default: 0,
        },
        estimatedDurationMin: {
            type: Number,
            min: [1, "Estimated duration must be at least 1 minute."],
        },
        allowedVehicleTypes: [
            {
                type: String,
                enum: {
                    values: Object.values(VEHICLE_TYPE),
                    message: `Allowed vehicle type must be one of: ${Object.values(VEHICLE_TYPE).join(", ")}`,
                },
            },
        ],
        isActive: {
            type: Boolean,
            default: true,
            required: true,
        },
    },
    {
        timestamps: true,
    }
);

// Database indexes for efficient querying and uniqueness
serviceSchema.index({ status: 1, isActive: 1 });
serviceSchema.index({ type: 1 });

module.exports = mongoose.model("Service", serviceSchema);
