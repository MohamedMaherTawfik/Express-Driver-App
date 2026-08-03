const ForbiddenError = require("../errors/ForbiddenError");

const authorizeMiddleware = (...roles) => {
    return (req, res, next) => {
        if (roles.includes(req.user.role)) {
            return next();
        }

        throw new ForbiddenError("You are not allowed to access this resource");
    };
};

module.exports = authorizeMiddleware;
