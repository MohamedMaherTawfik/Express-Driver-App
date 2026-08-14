const driverService = require("../services/driverService");
const ApiResponse = require("../../../shared/utils/response");

class DriverController {

    async getMyDriver(req, res, next) {
        try {
            const driver = await driverService.getDriverByUserId(req.user.id);
            return ApiResponse.ok(res, driver);
        } catch (error) {
            next(error);
        }
    }

    async getDriverById(req, res, next) {
        try {
            const driver = await driverService.getDriverById(req.params.id);
            return ApiResponse.ok(res, driver);
        } catch (error) {
            next(error);
        }
    }

    async updateAvailability(req, res, next) {
        try {
            const driver = await driverService.getDriverByUserId(req.user.id);

            const updated = await driverService.updateAvailability(
                driver._id,
                req.body.availabilityStatus
            );

            return ApiResponse.ok(
                res,
                updated,
                "Availability updated successfully."
            );
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new DriverController();
