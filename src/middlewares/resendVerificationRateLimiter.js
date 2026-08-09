const createRateLimiter = require("../config/rateLimiter");

module.exports = createRateLimiter({
    windowMs: 15 * 60 * 1000,
    max: 3,
    message: "Too many verification email requests. Please try again later."
});