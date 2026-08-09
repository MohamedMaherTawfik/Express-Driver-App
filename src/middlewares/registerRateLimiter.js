const createRateLimiter = require("../config/rateLimiter");

module.exports = createRateLimiter({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: "Too many registration attempts. Please try again later."
});