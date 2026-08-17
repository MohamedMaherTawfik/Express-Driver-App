const serviceService = require("../services/serviceService");
const ApiResponse = require("../../../shared/utils/response");

class ServiceController {
    async createService(req, res, next) {
        try {
            const service = await serviceService.createService(req.body);
            return ApiResponse.created(res, service, "Service created successfully.");
        } catch (error) {
            next(error);
        }
    }

    async getServices(req, res, next) {
        try {
            const { items, total } = await serviceService.getServices(req.query, req.user?.role);
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

    async getServiceById(req, res, next) {
        try {
            const service = await serviceService.getServiceById(req.params.id, req.user?.role);
            return ApiResponse.ok(res, service);
        } catch (error) {
            next(error);
        }
    }

    async getServiceBySlug(req, res, next) {
        try {
            const service = await serviceService.getServiceBySlug(req.params.slug, req.user?.role);
            return ApiResponse.ok(res, service);
        } catch (error) {
            next(error);
        }
    }

    async updateService(req, res, next) {
        try {
            const service = await serviceService.updateService(req.params.id, req.body);
            return ApiResponse.ok(res, service, "Service updated successfully.");
        } catch (error) {
            next(error);
        }
    }

    async deleteService(req, res, next) {
        try {
            await serviceService.deleteService(req.params.id, {
                hardDelete: req.query.hard === "true",
            });
            return ApiResponse.noContent(res);
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new ServiceController();
