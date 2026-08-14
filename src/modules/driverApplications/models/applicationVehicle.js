const mongoose = require("mongoose");
const { VEHICLE_TYPE } = require("../constant/driverApplicationConstants");

const applicationVehicleSchema = new mongoose.Schema(
    {
        type: {
            type: String,
            enum: Object.values(VEHICLE_TYPE),
            required: true,
        },

        make: {
            type: String,
            trim: true,
            required: true,
            maxlength: 100,
        },

        model: {
            type: String,
            trim: true,
            required: true,
            maxlength: 100,
        },

        year: {
            type: Number,
            required: true,
        },

        color: {
            type: String,
            trim: true,
            required: true,
            maxlength: 50,
        },

        plateNumber: {
            type: String,
            trim: true,
            required: true,
            maxlength: 50,
        },

        /*
         * Each application can have exactly one vehicle submission.
         * unique: true enforces this at the DB level.
         */
        application: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "DriverApplication",
            required: true,
            unique: true,
        },
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model("ApplicationVehicle", applicationVehicleSchema);
