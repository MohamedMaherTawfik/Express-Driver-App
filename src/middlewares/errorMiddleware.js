const AppError = require("../errors/AppError");
const httpStatus = require("../constants/httpStatus");

const buildErrorResponse = (err) => {
    if (err.errors) {
        return {
            success: false,
            errors: err.errors
        };
    }

    const response = {
        success: false,
        message: err.message || "Internal Server Error"
    };

    return response;
};

const normalizeError = (err) => {
    if (err instanceof AppError) {
        return err;
    }

    if (err.name === "JsonWebTokenError") {
        return new AppError("Invalid token", httpStatus.UNAUTHORIZED);
    }

    if (err.name === "TokenExpiredError") {
        return new AppError("Token expired", httpStatus.UNAUTHORIZED);
    }

    if (err.name === "CastError") {
        return new AppError("Resource not found", httpStatus.NOT_FOUND);
    }

    if (err.code === 11000) {
        return new AppError("Duplicate field value", httpStatus.BAD_REQUEST);
    }

    if (err.name === "MulterError") {
        return new AppError(err.message, httpStatus.BAD_REQUEST);
    }

    return new AppError("Internal Server Error", httpStatus.INTERNAL_SERVER_ERROR);
};

const errorMiddleware = (err, req, res, next) => {
    const normalizedError = normalizeError(err);

    return res
        .status(normalizedError.statusCode)
        .json(buildErrorResponse(normalizedError));
};

module.exports = errorMiddleware;
