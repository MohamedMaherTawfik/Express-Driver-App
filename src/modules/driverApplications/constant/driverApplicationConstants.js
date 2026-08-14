const DRIVER_APPLICATION_STATUS = Object.freeze({
    PENDING: "pending",
    APPROVED: "approved",
    REJECTED: "rejected",
});

const VEHICLE_TYPE = Object.freeze({
    SEDAN: "sedan",
    SUV: "suv",
    TRUCK: "truck",
    VAN: "van",
    MOTORCYCLE: "motorcycle",
});

module.exports = {
    DRIVER_APPLICATION_STATUS,
    VEHICLE_TYPE,
};
