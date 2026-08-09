const createRateLimiter = require("../config/rateLimiter");

module.exports = createRateLimiter({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: "Too many login attempts. Please try again later."
});