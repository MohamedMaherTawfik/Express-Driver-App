const jwt = require("jsonwebtoken");
const User = require("../models/User");
const asyncHandler = require("../utils/asyncHandler");
const ApiResponse = require("../utils/response");

const protect = asyncHandler(async (req, res, next) => {
    let token;
    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith("Bearer")
    ) {

        token = req.headers.authorization.split(" ")[1];

    }
    if (!token) {
        return ApiResponse.unauthorized(
            res,
            "You are not logged in"
        );
    }
    const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET
    );
    const user = await User.findById(decoded.id);
    if (!user) {
        return ApiResponse.unauthorized(
            res,
            "User no longer exists"
        );
    }
    req.user = user;
    next();
});

const authorize = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return ApiResponse.forbidden(
                res,
                "You are not allowed to access this resource"
            );
        }
        next();
    };
};

module.exports = {
    protect,
    authorize
};