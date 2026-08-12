const createRateLimiter = require("../../../shared/config/rateLimiter");

module.exports = createRateLimiter({
    windowMs: 15 * 60 * 1000,
    max: 5,
    prefix: "rate-limit:resend-verification",
    message: "Too many verification email requests. Please try again later."
});