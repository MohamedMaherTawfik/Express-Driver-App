const mongoose = require("mongoose");
const {
    DRIVER_STATUS,
    DRIVER_AVAILABILITY_STATUS,
} = require("../constants/driverConstants");

const driverSchema = new mongoose.Schema(
    {
        /*
         * The user this driver belongs to.
         * unique: one Driver record per User.
         */
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            unique: true,
        },

        /*
         * The DriverApplication that was approved to create this Driver.
         * Provides an audit trail back to the original application.
         */
        application: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "DriverApplication",
            required: true,
        },

        status: {
            type: String,
            enum: Object.values(DRIVER_STATUS),
            default: DRIVER_STATUS.ACTIVE,
            required: true,
        },

        availabilityStatus: {
            type: String,
            enum: Object.values(DRIVER_AVAILABILITY_STATUS),
            default: DRIVER_AVAILABILITY_STATUS.OFFLINE,
            required: true,
        },

        /*
         * Timestamp when the application was approved and this Driver was created.
         */
        approvedAt: {
            type: Date,
            required: true,
        },

        /*
         * License number carried from the approved application for quick lookup.
         */
        licenseNumber: {
            type: String,
            trim: true,
            required: true,
        },
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model("Driver", driverSchema);
