const driverRepository = require("../../modules/drivers/repositories/driverRepository");
const ForbiddenError = require("../errors/ForbiddenError");
const asyncHandler = require("../utils/asyncHandler");

/**
 * Middleware that resolves the Driver document for the currently authenticated user.
 * Sets req.driver if found; throws ForbiddenError if user has no active driver profile.
 *
 * Usage: place after protectMiddleware on driver-only routes.
 */
const requireDriverMiddleware = asyncHandler(async (req, res, next) => {
    const driver = await driverRepository.findByUserId(req.user._id);

    if (!driver) {
        throw new ForbiddenError("You do not have an active driver profile.");
    }

    if (driver.status !== "active") {
        throw new ForbiddenError("Your driver profile is not active.");
    }

    req.driver = driver;
    next();
});

module.exports = requireDriverMiddleware;
