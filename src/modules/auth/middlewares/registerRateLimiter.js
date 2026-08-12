const createRateLimiter = require("../../../shared/config/rateLimiter");

module.exports = createRateLimiter({
    windowMs: 15 * 60 * 1000,
    max: 5,
    prefix: "rate-limit:register",
    message: "Too many registration attempts. Please try again later."
});