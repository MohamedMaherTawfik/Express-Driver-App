const Redis = require("ioredis");
const logger = require("../../shared/config/logger");

const redis = new Redis(process.env.REDIS_URL, {
    maxRetriesPerRequest: 3,
    enableReadyCheck: true,
    lazyConnect: true
});

redis.on("connect", () => {
    logger.info("Redis connecting...");
});

redis.on("ready", () => {
    logger.info("Redis connected and ready");
});

redis.on("error", (error) => {
    logger.error("Redis connection error", {
        message: error.message,
        stack: error.stack
    });
});

redis.on("close", () => {
    logger.warn("Redis connection closed");
});

module.exports = redis;