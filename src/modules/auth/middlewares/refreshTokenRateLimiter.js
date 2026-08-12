const createRateLimiter = require("../../../shared/config/rateLimiter");

module.exports = createRateLimiter({
    windowMs: 15 * 60 * 1000,
    max: 20,
    prefix: "rate-limit:refresh-token",
    message: "Too many refresh token requests. Please try again later."
});