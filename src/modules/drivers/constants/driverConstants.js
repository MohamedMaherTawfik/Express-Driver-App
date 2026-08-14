const DRIVER_STATUS = Object.freeze({
    ACTIVE: "active",
    SUSPENDED: "suspended",
    INACTIVE: "inactive",
});

const DRIVER_AVAILABILITY_STATUS = Object.freeze({
    OFFLINE: "offline",
    AVAILABLE: "available",
    BUSY: "busy",
});

module.exports = {
    DRIVER_STATUS,
    DRIVER_AVAILABILITY_STATUS,
};
