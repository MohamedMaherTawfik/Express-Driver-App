const DispatchOffer = require("../models/dispatchOffer");
const Driver = require("../../drivers/models/driver");
const { DISPATCH_OFFER_STATUS } = require("../constants/dispatchConstants");
const { DRIVER_STATUS, DRIVER_AVAILABILITY_STATUS } = require("../../drivers/constants/driverConstants");

class DispatchRepository {
    async createOffer(data, options = {}) {
        if (options.session) {
            const [offer] = await DispatchOffer.create([data], { session: options.session });
            return offer;
        }
        return DispatchOffer.create(data);
    }

    async findOfferById(id) {
        return DispatchOffer.findById(id)
            .populate({
                path: "driver",
                populate: [
                    { path: "user", select: "name email" },
                    { path: "application" },
                    { path: "vehicle" },
                ],
            })
            .populate("vehicle")
            .populate("order");
    }

    async findOpenOfferByOrder(orderId) {
        return DispatchOffer.findOne({
            order: orderId,
            status: DISPATCH_OFFER_STATUS.OFFERED,
        }).sort({ createdAt: -1 });
    }

    async findPreviousDriverIds(orderId) {
        const offers = await DispatchOffer.find({ order: orderId }).select("driver").lean();
        return offers.map((offer) => offer.driver.toString());
    }

    async findDriversWithOpenOffers(driverIds) {
        const offers = await DispatchOffer.find({
            driver: { $in: driverIds },
            status: DISPATCH_OFFER_STATUS.OFFERED,
        }).select("driver").lean();

        return new Set(offers.map((offer) => offer.driver.toString()));
    }

    async findCandidateDrivers({ excludedDriverIds = [], limit = 25 } = {}) {
        const filter = {
            status: DRIVER_STATUS.ACTIVE,
            availabilityStatus: DRIVER_AVAILABILITY_STATUS.AVAILABLE,
        };

        if (excludedDriverIds.length > 0) {
            filter._id = { $nin: excludedDriverIds };
        }

        return Driver.find(filter)
            .populate("user", "name email")
            .populate("application")
            .populate("vehicle")
            .sort({ createdAt: 1, _id: 1 })
            .limit(limit);
    }

    async acceptOfferAtomic(offerId, driverId, now = new Date(), options = {}) {
        return DispatchOffer.findOneAndUpdate(
            {
                _id: offerId,
                driver: driverId,
                status: DISPATCH_OFFER_STATUS.OFFERED,
                expiresAt: { $gt: now },
            },
            {
                $set: {
                    status: DISPATCH_OFFER_STATUS.ACCEPTED,
                    respondedAt: now,
                },
            },
            { new: true, session: options.session || null }
        );
    }

    async rejectOfferAtomic(offerId, driverId, reason = null, now = new Date(), options = {}) {
        return DispatchOffer.findOneAndUpdate(
            {
                _id: offerId,
                driver: driverId,
                status: DISPATCH_OFFER_STATUS.OFFERED,
            },
            {
                $set: {
                    status: DISPATCH_OFFER_STATUS.REJECTED,
                    rejectionReason: reason,
                    respondedAt: now,
                },
            },
            { new: true, session: options.session || null }
        );
    }

    async expireOfferAtomic(offerId, now = new Date(), options = {}) {
        return DispatchOffer.findOneAndUpdate(
            {
                _id: offerId,
                status: DISPATCH_OFFER_STATUS.OFFERED,
                expiresAt: { $lte: now },
            },
            {
                $set: {
                    status: DISPATCH_OFFER_STATUS.EXPIRED,
                    respondedAt: now,
                },
            },
            { new: true, session: options.session || null }
        );
    }

    async cancelOfferAtomic(offerId, now = new Date(), options = {}) {
        return DispatchOffer.findOneAndUpdate(
            {
                _id: offerId,
                status: DISPATCH_OFFER_STATUS.OFFERED,
            },
            {
                $set: {
                    status: DISPATCH_OFFER_STATUS.CANCELLED,
                    respondedAt: now,
                },
            },
            { new: true, session: options.session || null }
        );
    }
}

module.exports = new DispatchRepository();
