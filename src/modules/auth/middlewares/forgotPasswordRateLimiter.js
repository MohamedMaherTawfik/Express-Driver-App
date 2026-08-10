const createRateLimiter = require("../../../shared/config/rateLimiter");

module.exports = createRateLimiter({
    windowMs: 15 * 60 * 1000,

    max: 3,

    message: {
        success: false,
        message: "Too many password reset requests. Please try again later."
    }
});