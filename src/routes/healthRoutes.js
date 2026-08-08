const express = require("express");

const redisService = require("../services/redisService");
const ApiResponse = require("../utils/response");

const router = express.Router();

router.get("/redis", async (req, res, next) => {

    try {

        const result = await redisService.ping();

        return ApiResponse.ok(
            res,
            {
                redis: result === "PONG"
                    ? "connected"
                    : "unhealthy"
            },
            "Redis health check"
        );

    } catch (error) {

        next(error);

    }

});

module.exports = router;