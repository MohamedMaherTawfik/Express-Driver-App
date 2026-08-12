const createRateLimiter = require("../config/rateLimiter");

module.exports = createRateLimiter({
    windowMs: 15 * 60 * 1000,
    max: 100,
    prefix: "rate-limit:global",
    message: "Too many requests. Please try again later."
});