const authService = require("../../modules/auth/services/authService");
const getBearerToken = require("../helpers/bearerTokenHelper");
const asyncHandler = require("../utils/asyncHandler");

const protectMiddleware = asyncHandler(async (req, res, next) => {
    const token = getBearerToken(req);

    req.user = await authService.getAuthenticatedUser(token);
    next();
});

module.exports = protectMiddleware;
