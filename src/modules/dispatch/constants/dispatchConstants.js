const DISPATCH_OFFER_STATUS = Object.freeze({
    OFFERED: "offered",
    ACCEPTED: "accepted",
    REJECTED: "rejected",
    EXPIRED: "expired",
    CANCELLED: "cancelled",
});

const DISPATCH_RESULT = Object.freeze({
    OFFER_CREATED: "offer_created",
    EXISTING_OFFER: "existing_offer",
    NO_CANDIDATES: "no_candidates",
    ACCEPTED: "accepted",
    REJECTED: "rejected",
    EXPIRED: "expired",
});

const DISPATCH_NOTIFICATION_TYPES = Object.freeze({
    OFFER_CREATED: "dispatch_offer_created",
    OFFER_ACCEPTED: "dispatch_offer_accepted",
    OFFER_REJECTED: "dispatch_offer_rejected",
    OFFER_EXPIRED: "dispatch_offer_expired",
    NO_CANDIDATES: "dispatch_no_candidates",
});

const DEFAULT_OFFER_TIMEOUT_SECONDS = 45;

module.exports = {
    DISPATCH_OFFER_STATUS,
    DISPATCH_RESULT,
    DISPATCH_NOTIFICATION_TYPES,
    DEFAULT_OFFER_TIMEOUT_SECONDS,
};
