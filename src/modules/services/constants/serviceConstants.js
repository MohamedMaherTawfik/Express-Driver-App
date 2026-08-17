const { VEHICLE_TYPE } = require("../../vehicles/constants/vehicleConstants");

const SERVICE_TYPE = Object.freeze({
    DELIVERY: "delivery",
    EXPRESS_DELIVERY: "express_delivery",
    RIDE: "ride",
    FREIGHT: "freight",
    COURIER: "courier",
});

const SERVICE_STATUS = Object.freeze({
    ACTIVE: "active",
    INACTIVE: "inactive",
});

module.exports = {
    SERVICE_TYPE,
    SERVICE_STATUS,
    VEHICLE_TYPE,
};
