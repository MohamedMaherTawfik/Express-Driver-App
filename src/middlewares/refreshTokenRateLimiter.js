const createRateLimiter = require("../config/rateLimiter");

module.exports = createRateLimiter({
    windowMs: 15 * 60 * 1000,
    max: 20,
    message: "Too many refresh token attempts. Please try again later."
});