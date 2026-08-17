const mongoose = require("mongoose");

const dispatchRepository = require("../repositories/dispatchRepository");
const orderRepository = require("../../orders/repositories/orderRepository");
const serviceRepository = require("../../services/repositories/serviceRepository");
const driverRepository = require("../../drivers/repositories/driverRepository");
const notificationService = require("../../notifications/services/notificationService");

const {
    DISPATCH_OFFER_STATUS,
    DISPATCH_RESULT,
    DISPATCH_NOTIFICATION_TYPES,
    DEFAULT_OFFER_TIMEOUT_SECONDS,
} = require("../constants/dispatchConstants");
const { ORDER_STATUS } = require("../../orders/constants/orderConstants");
const { DRIVER_STATUS, DRIVER_AVAILABILITY_STATUS } = require("../../drivers/constants/driverConstants");
const { DRIVER_APPLICATION_STATUS } = require("../../driverApplications/constant/driverApplicationConstants");
const { VEHICLE_STATUS } = require("../../vehicles/constants/vehicleConstants");

const NotFoundError = require("../../../shared/errors/NotFoundError");
const BadRequestError = require("../../../shared/errors/BadRequestError");
const ForbiddenError = require("../../../shared/errors/ForbiddenError");

const ACTIVE_ORDER_STATUSES = Object.freeze([
    ORDER_STATUS.DRIVER_ASSIGNED,
    ORDER_STATUS.DRIVER_ARRIVING,
    ORDER_STATUS.DRIVER_ARRIVED,
    ORDER_STATUS.PICKED_UP,
    ORDER_STATUS.IN_TRANSIT,
]);

class DispatchService {
    async startDispatch(orderId, options = {}) {
        const now = options.now || new Date();
        let order = await orderRepository.findByIdRaw(orderId);

        if (!order) {
            throw new NotFoundError("Order");
        }

        if (order.status === ORDER_STATUS.PENDING) {
            order = await orderRepository.updateStatusAtomic(
                orderId,
                ORDER_STATUS.PENDING,
                ORDER_STATUS.SEARCHING_DRIVER
            );

            if (!order) {
                throw new BadRequestError("Order changed concurrently. Please retry dispatch.");
            }
        }

        if (order.status !== ORDER_STATUS.SEARCHING_DRIVER) {
            throw new BadRequestError("Only orders in SEARCHING_DRIVER status can be dispatched.");
        }

        await this._assertServiceDispatchable(order);

        const openOffer = await dispatchRepository.findOpenOfferByOrder(orderId);
        if (openOffer) {
            if (openOffer.expiresAt <= now) {
                await dispatchRepository.expireOfferAtomic(openOffer._id, now);
            } else {
                return {
                    result: DISPATCH_RESULT.EXISTING_OFFER,
                    offer: openOffer,
                };
            }
        }

        const previousDriverIds = await dispatchRepository.findPreviousDriverIds(orderId);
        const candidates = await this._findEligibleCandidates(order, previousDriverIds);

        if (candidates.length === 0) {
            this._notifySafely(order.user, {
                type: DISPATCH_NOTIFICATION_TYPES.NO_CANDIDATES,
                title: "No Driver Available",
                message: `No eligible driver is currently available for order ${order.orderNumber}.`,
                data: { orderId: order._id, orderNumber: order.orderNumber },
            });

            return {
                result: DISPATCH_RESULT.NO_CANDIDATES,
                offer: null,
            };
        }

        const selected = this.selectBestDriver(candidates);
        const expiresAt = new Date(
            now.getTime() + (options.timeoutSeconds || DEFAULT_OFFER_TIMEOUT_SECONDS) * 1000
        );

        try {
            const offer = await dispatchRepository.createOffer({
                order: order._id,
                driver: selected.driver._id,
                vehicle: selected.vehicle._id,
                status: DISPATCH_OFFER_STATUS.OFFERED,
                expiresAt,
                metadata: {
                    selectionStrategy: "stable_created_at",
                    orderNumber: order.orderNumber,
                },
            });

            this._notifySafely(this._getUserId(selected.driver.user), {
                type: DISPATCH_NOTIFICATION_TYPES.OFFER_CREATED,
                title: "New Delivery Offer",
                message: `You have a new offer for order ${order.orderNumber}.`,
                data: {
                    orderId: order._id,
                    offerId: offer._id,
                    vehicleId: selected.vehicle._id,
                    expiresAt,
                },
            });

            return {
                result: DISPATCH_RESULT.OFFER_CREATED,
                offer,
            };
        } catch (err) {
            if (err && err.code === 11000) {
                const existing = await dispatchRepository.findOpenOfferByOrder(orderId);
                return {
                    result: DISPATCH_RESULT.EXISTING_OFFER,
                    offer: existing,
                };
            }
            throw err;
        }
    }

    async retryDispatch(orderId, options = {}) {
        return this.startDispatch(orderId, options);
    }

    async acceptOffer(offerId, requestingUser, requestingDriver, options = {}) {
        if (!requestingDriver) {
            throw new ForbiddenError("Only the offered driver can accept a dispatch offer.");
        }

        const now = options.now || new Date();
        const offer = await dispatchRepository.findOfferById(offerId);
        if (!offer) {
            throw new NotFoundError("Dispatch offer");
        }

        this._assertOfferBelongsToDriver(offer, requestingDriver);

        if (offer.status === DISPATCH_OFFER_STATUS.ACCEPTED) {
            return {
                result: DISPATCH_RESULT.ACCEPTED,
                offer,
                idempotent: true,
            };
        }

        if (offer.status !== DISPATCH_OFFER_STATUS.OFFERED) {
            throw new BadRequestError(`Cannot accept an offer with status "${offer.status}".`);
        }

        if (offer.expiresAt <= now) {
            await dispatchRepository.expireOfferAtomic(offer._id, now);
            throw new BadRequestError("Dispatch offer has expired.");
        }

        const order = await orderRepository.findByIdRaw(this._getId(offer.order));
        if (!order) {
            throw new NotFoundError("Order");
        }

        if (order.status !== ORDER_STATUS.SEARCHING_DRIVER) {
            throw new BadRequestError("Order is no longer accepting driver assignments.");
        }

        await this._assertServiceDispatchable(order);
        this._assertCandidateEligible({
            driver: offer.driver,
            vehicle: offer.vehicle,
            order,
            skipOpenOfferCheck: true,
        });

        let acceptedOffer = null;
        let claimedDriver = null;
        let assignedOrder = null;
        let usedTransaction = false;

        try {
            const result = await this._withOptionalTransaction(async (session) => {
                usedTransaction = Boolean(session);

                acceptedOffer = await dispatchRepository.acceptOfferAtomic(
                    offer._id,
                    requestingDriver._id,
                    now,
                    { session }
                );

                if (!acceptedOffer) {
                    throw new BadRequestError("Offer was updated concurrently. Please retry.");
                }

                claimedDriver = await driverRepository.claimAvailableDriver(
                    requestingDriver._id,
                    { session }
                );

                if (!claimedDriver) {
                    throw new BadRequestError("Driver is no longer available.");
                }

                assignedOrder = await orderRepository.assignDriverAtomic(
                    order._id,
                    ORDER_STATUS.SEARCHING_DRIVER,
                    ORDER_STATUS.DRIVER_ASSIGNED,
                    requestingDriver._id,
                    this._getId(offer.vehicle),
                    { session }
                );

                if (!assignedOrder) {
                    throw new BadRequestError("Order is no longer assignable.");
                }

                return { acceptedOffer, assignedOrder, claimedDriver };
            });

            this._notifySafely(order.user, {
                type: DISPATCH_NOTIFICATION_TYPES.OFFER_ACCEPTED,
                title: "Driver Assigned",
                message: `A driver accepted order ${order.orderNumber}.`,
                data: {
                    orderId: order._id,
                    offerId: acceptedOffer._id,
                    driverId: requestingDriver._id,
                    vehicleId: this._getId(offer.vehicle),
                },
            });

            return {
                result: DISPATCH_RESULT.ACCEPTED,
                offer: result.acceptedOffer,
                order: result.assignedOrder,
                driver: result.claimedDriver,
            };
        } catch (err) {
            if (!usedTransaction && claimedDriver && !assignedOrder) {
                await driverRepository.releaseBusyDriver(requestingDriver._id).catch(() => {});
                await dispatchRepository.cancelOfferAtomic(offer._id, now).catch(() => {});
            }
            throw err;
        }
    }

    async rejectOffer(offerId, requestingUser, requestingDriver, reason = null, options = {}) {
        if (!requestingDriver) {
            throw new ForbiddenError("Only the offered driver can reject a dispatch offer.");
        }

        const now = options.now || new Date();
        const offer = await dispatchRepository.findOfferById(offerId);
        if (!offer) {
            throw new NotFoundError("Dispatch offer");
        }

        this._assertOfferBelongsToDriver(offer, requestingDriver);

        if (offer.status === DISPATCH_OFFER_STATUS.REJECTED) {
            return {
                result: DISPATCH_RESULT.REJECTED,
                offer,
                idempotent: true,
            };
        }

        if (offer.status !== DISPATCH_OFFER_STATUS.OFFERED) {
            throw new BadRequestError(`Cannot reject an offer with status "${offer.status}".`);
        }

        const rejected = await dispatchRepository.rejectOfferAtomic(
            offer._id,
            requestingDriver._id,
            reason,
            now
        );

        if (!rejected) {
            throw new BadRequestError("Offer was updated concurrently. Please retry.");
        }

        this._notifySafely(this._getUserId(offer.driver.user), {
            type: DISPATCH_NOTIFICATION_TYPES.OFFER_REJECTED,
            title: "Offer Rejected",
            message: "Your dispatch offer was rejected.",
            data: { offerId: offer._id, orderId: this._getId(offer.order), reason },
        });

        const response = {
            result: DISPATCH_RESULT.REJECTED,
            offer: rejected,
        };

        if (options.retry !== false) {
            response.next = await this.retryDispatch(this._getId(offer.order), options);
        }

        return response;
    }

    async expireOffer(offerId, options = {}) {
        const now = options.now || new Date();
        const offer = await dispatchRepository.findOfferById(offerId);
        if (!offer) {
            throw new NotFoundError("Dispatch offer");
        }

        if (offer.status === DISPATCH_OFFER_STATUS.EXPIRED) {
            return {
                result: DISPATCH_RESULT.EXPIRED,
                offer,
                idempotent: true,
            };
        }

        if (offer.status !== DISPATCH_OFFER_STATUS.OFFERED) {
            throw new BadRequestError(`Cannot expire an offer with status "${offer.status}".`);
        }

        const expired = await dispatchRepository.expireOfferAtomic(offer._id, now);
        if (!expired) {
            throw new BadRequestError("Offer is not expired yet or changed concurrently.");
        }

        this._notifySafely(this._getUserId(offer.driver.user), {
            type: DISPATCH_NOTIFICATION_TYPES.OFFER_EXPIRED,
            title: "Offer Expired",
            message: "Your dispatch offer has expired.",
            data: { offerId: offer._id, orderId: this._getId(offer.order) },
        });

        const response = {
            result: DISPATCH_RESULT.EXPIRED,
            offer: expired,
        };

        if (options.retry !== false) {
            response.next = await this.retryDispatch(this._getId(offer.order), options);
        }

        return response;
    }

    selectBestDriver(candidates) {
        return candidates[0] || null;
    }

    async _findEligibleCandidates(order, excludedDriverIds) {
        const candidates = await dispatchRepository.findCandidateDrivers({ excludedDriverIds });
        const candidateIds = candidates.map((driver) => driver._id.toString());
        const driversWithOpenOffers = await dispatchRepository.findDriversWithOpenOffers(candidateIds);
        const eligible = [];

        for (const driver of candidates) {
            if (driversWithOpenOffers.has(driver._id.toString())) {
                continue;
            }

            const vehicle = driver.vehicle;
            const activeOrder = await orderRepository.exists({
                driver: driver._id,
                status: { $in: ACTIVE_ORDER_STATUSES },
            });

            if (activeOrder) {
                continue;
            }

            try {
                this._assertCandidateEligible({ driver, vehicle, order });
                eligible.push({ driver, vehicle });
            } catch (_) {
                // Candidate exclusion is expected during dispatch filtering.
            }
        }

        return eligible;
    }

    _assertCandidateEligible({ driver, vehicle, order }) {
        if (!driver || driver.status !== DRIVER_STATUS.ACTIVE) {
            throw new BadRequestError("Driver is not active.");
        }

        if (driver.availabilityStatus !== DRIVER_AVAILABILITY_STATUS.AVAILABLE) {
            throw new BadRequestError("Driver is not available.");
        }

        if (!driver.application || driver.application.status !== DRIVER_APPLICATION_STATUS.APPROVED) {
            throw new BadRequestError("Driver does not have an approved application.");
        }

        if (!vehicle) {
            throw new BadRequestError("Driver has no vehicle.");
        }

        if (!vehicle.isActive || vehicle.status !== VEHICLE_STATUS.ACTIVE) {
            throw new BadRequestError("Vehicle is not active.");
        }

        const vehicleDriverId = vehicle.driver?._id
            ? vehicle.driver._id.toString()
            : vehicle.driver?.toString();

        if (vehicleDriverId && vehicleDriverId !== driver._id.toString()) {
            throw new BadRequestError("Vehicle does not belong to driver.");
        }

        const allowedTypes = order.serviceSnapshot?.allowedVehicleTypes || [];
        if (allowedTypes.length > 0 && !allowedTypes.includes(vehicle.type)) {
            throw new BadRequestError("Vehicle type is not compatible with service.");
        }
    }

    async _assertServiceDispatchable(order) {
        const service = await serviceRepository.findById(order.service);
        if (!service) {
            throw new NotFoundError("Service");
        }

        if (!service.isActive || service.status !== "active") {
            throw new BadRequestError("Inactive service cannot be dispatched.");
        }
    }

    _assertOfferBelongsToDriver(offer, requestingDriver) {
        const offerDriverId = this._getId(offer.driver);
        if (offerDriverId.toString() !== requestingDriver._id.toString()) {
            throw new ForbiddenError("This dispatch offer belongs to another driver.");
        }
    }

    async _withOptionalTransaction(callback) {
        if (mongoose.connection.readyState !== 1) {
            return callback(null);
        }

        const session = await mongoose.startSession();
        try {
            let result;
            await session.withTransaction(async () => {
                result = await callback(session);
            });
            return result;
        } finally {
            await session.endSession();
        }
    }

    _notifySafely(userId, notifData) {
        if (!userId) return;

        notificationService
            .createNotification({ userId, ...notifData })
            .catch((err) => {
                console.warn("[DispatchService] Notification failed:", err.message);
            });
    }

    _getId(docOrId) {
        return docOrId?._id || docOrId;
    }

    _getUserId(user) {
        return user?._id || user;
    }
}

module.exports = new DispatchService();
