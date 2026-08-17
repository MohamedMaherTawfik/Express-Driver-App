const mongoose = require("mongoose");
const { DISPATCH_OFFER_STATUS } = require("../constants/dispatchConstants");

const dispatchOfferSchema = new mongoose.Schema(
    {
        order: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Order",
            required: true,
            index: true,
        },
        driver: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Driver",
            required: true,
            index: true,
        },
        vehicle: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Vehicle",
            required: true,
        },
        status: {
            type: String,
            enum: Object.values(DISPATCH_OFFER_STATUS),
            default: DISPATCH_OFFER_STATUS.OFFERED,
            required: true,
            index: true,
        },
        expiresAt: {
            type: Date,
            required: true,
            index: true,
        },
        respondedAt: {
            type: Date,
            default: null,
        },
        rejectionReason: {
            type: String,
            trim: true,
            maxlength: 500,
            default: null,
        },
        metadata: {
            type: Map,
            of: mongoose.Schema.Types.Mixed,
            default: {},
        },
    },
    {
        timestamps: true,
    }
);

dispatchOfferSchema.index(
    { order: 1 },
    {
        unique: true,
        partialFilterExpression: { status: DISPATCH_OFFER_STATUS.OFFERED },
        name: "unique_open_offer_per_order",
    }
);

dispatchOfferSchema.index(
    { driver: 1 },
    {
        unique: true,
        partialFilterExpression: { status: DISPATCH_OFFER_STATUS.OFFERED },
        name: "unique_open_offer_per_driver",
    }
);

dispatchOfferSchema.index({ order: 1, driver: 1, createdAt: -1 });

module.exports = mongoose.model("DispatchOffer", dispatchOfferSchema);
