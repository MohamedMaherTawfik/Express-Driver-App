const vehicleService = require("../services/vehicleService");
const ApiResponse = require("../../../shared/utils/response");

class VehicleController {
    async createVehicle(req, res, next) {
        try {
            const vehicle = await vehicleService.createVehicle(req.user.id, req.user.role, req.body);
            return ApiResponse.created(res, vehicle, "Vehicle created successfully.");
        } catch (error) {
            next(error);
        }
    }

    async getVehicleById(req, res, next) {
        try {
            const vehicle = await vehicleService.getVehicleById(req.params.id, req.user.id, req.user.role);
            return ApiResponse.ok(res, vehicle);
        } catch (error) {
            next(error);
        }
    }

    async getVehicles(req, res, next) {
        try {
            const { items, total } = await vehicleService.getVehicles(req.user.id, req.user.role, req.query);
            const { page = 1, limit = 10 } = req.query;
            return ApiResponse.ok(res, items, undefined, {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                pages: Math.ceil(total / parseInt(limit)),
            });
        } catch (error) {
            next(error);
        }
    }

    async updateVehicle(req, res, next) {
        try {
            const vehicle = await vehicleService.updateVehicle(req.params.id, req.user.id, req.user.role, req.body);
            return ApiResponse.ok(res, vehicle, "Vehicle updated successfully.");
        } catch (error) {
            next(error);
        }
    }

    async deleteVehicle(req, res, next) {
        try {
            await vehicleService.deleteVehicle(req.params.id, req.user.id, req.user.role);
            return ApiResponse.noContent(res);
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new VehicleController();
