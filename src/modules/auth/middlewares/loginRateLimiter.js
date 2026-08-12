const createRateLimiter = require("../../../shared/config/rateLimiter");

module.exports = createRateLimiter({
    windowMs: 15 * 60 * 1000,
    max: 10,
    prefix: "rate-limit:login",
    message: "Too many login attempts. Please try again later."
});