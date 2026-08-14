const mongoose = require("mongoose");
const { DRIVER_APPLICATION_STATUS } = require("../constant/driverApplicationConstants");

const driverApplicationSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },

        status: {
            type: String,
            enum: Object.values(DRIVER_APPLICATION_STATUS),
            default: DRIVER_APPLICATION_STATUS.PENDING,
            required: true,
        },

        licenseNumber: {
            type: String,
            trim: true,
            required: true,
        },

        licenseExpiry: {
            type: Date,
            required: true,
        },

        rejectionReason: {
            type: String,
            trim: true,
            maxlength: 1000,
        },

        reviewedAt: {
            type: Date,
        },

        reviewedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },
    },
    {
        timestamps: true,
    }
);

/*
 * Partial unique index: a user can only have ONE pending application at a time.
 * Historical (approved/rejected) applications are preserved.
 */
driverApplicationSchema.index(
    { user: 1, status: 1 },
    {
        unique: true,
        partialFilterExpression: { status: DRIVER_APPLICATION_STATUS.PENDING },
        name: "unique_pending_per_user",
    }
);

/*
 * Virtual populate: exposes the ApplicationVehicle as application.vehicle
 */
driverApplicationSchema.virtual("vehicle", {
    ref: "ApplicationVehicle",
    localField: "_id",
    foreignField: "application",
    justOne: true,
});

driverApplicationSchema.set("toJSON", { virtuals: true });
driverApplicationSchema.set("toObject", { virtuals: true });

module.exports = mongoose.model("DriverApplication", driverApplicationSchema);
