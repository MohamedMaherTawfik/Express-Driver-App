const express = require("express");
const router = express.Router();

const vehicleController = require("../controllers/vehicleController");
const {
    createVehicleValidator,
    updateVehicleValidator,
    getVehicleByIdValidator,
} = require("../validators/vehicleValidator");

const protectMiddleware = require("../../../shared/middlewares/protectMiddleware");
const validationMiddleware = require("../../../shared/middlewares/validationMiddleware");

// All vehicle routes require authentication
router.use(protectMiddleware);

router.post(
    "/",
    createVehicleValidator,
    validationMiddleware,
    vehicleController.createVehicle
);

router.get(
    "/",
    vehicleController.getVehicles
);

router.get(
    "/:id",
    getVehicleByIdValidator,
    validationMiddleware,
    vehicleController.getVehicleById
);

router.patch(
    "/:id",
    getVehicleByIdValidator,
    updateVehicleValidator,
    validationMiddleware,
    vehicleController.updateVehicle
);

router.delete(
    "/:id",
    getVehicleByIdValidator,
    validationMiddleware,
    vehicleController.deleteVehicle
);

module.exports = router;
