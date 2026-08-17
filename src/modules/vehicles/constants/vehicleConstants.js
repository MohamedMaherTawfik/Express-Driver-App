const { VEHICLE_TYPE } = require("../../driverApplications/constant/driverApplicationConstants");

const VEHICLE_STATUS = Object.freeze({
    ACTIVE: "active",
    INACTIVE: "inactive",
    PENDING: "pending",
    REJECTED: "rejected",
    SUSPENDED: "suspended",
});

module.exports = {
    VEHICLE_TYPE,
    VEHICLE_STATUS,
};