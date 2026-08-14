const driverApplicationService = require("../services/driverApplicationService");
const ApiResponse = require("../../../shared/utils/response");

class DriverApplicationController {

    async createApplication(req, res, next) {
        try {
            const application = await driverApplicationService.createApplication(
                req.user.id,
                {
                    licenseNumber: req.body.licenseNumber,
                    licenseExpiry: req.body.licenseExpiry,
                },
                req.body.vehicle
            );

            return ApiResponse.created(
                res,
                application,
                "Driver application submitted successfully."
            );
        } catch (error) {
            next(error);
        }
    }

    async getApplication(req, res, next) {
        try {
            const application = await driverApplicationService.getApplicationById(
                req.params.id
            );

            return ApiResponse.ok(res, application);
        } catch (error) {
            next(error);
        }
    }

    async getMyApplications(req, res, next) {
        try {
            const applications = await driverApplicationService.getUserApplications(
                req.user.id
            );

            return ApiResponse.ok(res, applications);
        } catch (error) {
            next(error);
        }
    }

    async rejectApplication(req, res, next) {
        try {
            const application = await driverApplicationService.rejectApplication(
                req.params.id,
                req.user.id,
                req.body.rejectionReason
            );

            return ApiResponse.ok(
                res,
                application,
                "Driver application rejected successfully."
            );
        } catch (error) {
            next(error);
        }
    }

    async approveApplication(req, res, next) {
        try {
            const application = await driverApplicationService.approveApplication(
                req.params.id,
                req.user.id
            );

            return ApiResponse.ok(
                res,
                application,
                "Driver application approved successfully. Driver profile created."
            );
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new DriverApplicationController();
