const rateLimit = require("express-rate-limit");
const { RedisStore } = require("rate-limit-redis");

const redis = require("../../infrastructure/redis/redis");

const createRateLimiter = ({
    windowMs = 15 * 60 * 1000,
    max = 100,
    message = "Too many requests. Please try again later."
} = {}) => {

    return rateLimit({

        store: new RedisStore({
            sendCommand: (...args) => redis.call(...args)
        }),

        windowMs,

        max,

        standardHeaders: true,

        legacyHeaders: false,

        message: {
            success: false,
            message
        }

    });

};

module.exports = createRateLimiter;