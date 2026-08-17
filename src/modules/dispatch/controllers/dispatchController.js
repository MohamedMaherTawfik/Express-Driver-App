const dispatchService = require("../services/dispatchService");
const ApiResponse = require("../../../shared/utils/response");

class DispatchController {
    async startDispatch(req, res, next) {
        try {
            const result = await dispatchService.startDispatch(req.params.id);
            return ApiResponse.ok(res, result, "Dispatch processed successfully.");
        } catch (error) {
            next(error);
        }
    }

    async retryDispatch(req, res, next) {
        try {
            const result = await dispatchService.retryDispatch(req.params.id);
            return ApiResponse.ok(res, result, "Dispatch retry processed successfully.");
        } catch (error) {
            next(error);
        }
    }

    async acceptOffer(req, res, next) {
        try {
            const result = await dispatchService.acceptOffer(
                req.params.id,
                req.user,
                req.driver
            );
            return ApiResponse.ok(res, result, "Dispatch offer accepted successfully.");
        } catch (error) {
            next(error);
        }
    }

    async rejectOffer(req, res, next) {
        try {
            const result = await dispatchService.rejectOffer(
                req.params.id,
                req.user,
                req.driver,
                req.body.reason || null
            );
            return ApiResponse.ok(res, result, "Dispatch offer rejected successfully.");
        } catch (error) {
            next(error);
        }
    }

    async expireOffer(req, res, next) {
        try {
            const result = await dispatchService.expireOffer(req.params.id);
            return ApiResponse.ok(res, result, "Dispatch offer expiry processed successfully.");
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new DispatchController();
