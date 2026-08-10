const { validationResult } = require("express-validator");
const ValidationError = require("../errors/ValidationError");

const validationMiddleware = (req, res, next) => {
    const errors = validationResult(req);

    if (errors.isEmpty()) {
        return next();
    }

    throw new ValidationError("Validation Error", errors.array());
};

module.exports = validationMiddleware;
