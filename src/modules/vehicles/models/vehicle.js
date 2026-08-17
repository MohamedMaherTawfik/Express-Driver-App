const mongoose = require("mongoose");
const { VEHICLE_TYPE, VEHICLE_STATUS } = require("../constants/vehicleConstants");

const vehicleSchema = new mongoose.Schema(
    {
        driver: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Driver",
            required: true,
            unique: true,
        },
        type: {
            type: String,
            enum: Object.values(VEHICLE_TYPE),
            required: true,
        },
        make: {
            type: String,
            required: true,
            trim: true,
            maxlength: 100,
        },
        model: {
            type: String,
            required: true,
            trim: true,
            maxlength: 100,
        },
        year: {
            type: Number,
            required: true,
        },
        color: {
            type: String,
            required: true,
            trim: true,
            maxlength: 50,
        },
        plateNumber: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            maxlength: 50,
        },
        registrationNumber: {
            type: String,
            unique: true,
            sparse: true,
            trim: true,
            maxlength: 100,
        },
        status: {
            type: String,
            enum: Object.values(VEHICLE_STATUS),
            default: VEHICLE_STATUS.ACTIVE,
            required: true,
        },
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

module.exports = mongoose.model("Vehicle", vehicleSchema);