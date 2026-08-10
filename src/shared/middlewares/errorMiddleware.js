const AppError = require("../errors/AppError");
const httpStatus = require("../constants/httpStatus");
const logger = require("../config/logger");

const buildErrorResponse = (err) => {

    if (err.errors) {

        return {
            success: false,
            errors: err.errors
        };

    }

    return {
        success: false,
        message: err.message
    };

};

const normalizeError = (err) => {

    if (err instanceof AppError) {
        return err;
    }

    if (err.name === "JsonWebTokenError") {
        return new AppError(
            "Invalid token",
            httpStatus.UNAUTHORIZED
        );
    }

    if (err.name === "TokenExpiredError") {
        return new AppError(
            "Token expired",
            httpStatus.UNAUTHORIZED
        );
    }

    if (err.name === "CastError") {
        return new AppError(
            "Resource not found",
            httpStatus.NOT_FOUND
        );
    }

    if (err.code === 11000) {
        return new AppError(
            "Duplicate field value",
            httpStatus.BAD_REQUEST
        );
    }

    if (err.name === "MulterError") {
        return new AppError(
            err.message,
            httpStatus.BAD_REQUEST
        );
    }

    return new AppError(
        "Internal Server Error",
        httpStatus.INTERNAL_SERVER_ERROR
    );

};

const errorMiddleware = (err, req, res, next) => {

    const error = normalizeError(err);

    logger.error("Unhandled Exception", {

        statusCode: error.statusCode,

        method: req.method,

        url: req.originalUrl,

        ip: req.ip,

        userAgent: req.get("user-agent"),

        message: err.message,

        stack: err.stack

    });

    return res
        .status(error.statusCode)
        .json(buildErrorResponse(error));

};

module.exports = errorMiddleware;