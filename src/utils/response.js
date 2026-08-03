class ApiResponse {

    static ok(res, data = null, message = "Success") {
        return res.status(200).json({
            success: true,
            message,
            data
        });
    }

    static created(res, data = null, message = "Created Successfully") {
        return res.status(201).json({
            success: true,
            message,
            data
        });
    }

    static noContent(res) {
        return res.status(204).send();
    }

    static badRequest(res, message = "Bad Request", errors = null) {
        return res.status(400).json({
            success: false,
            message,
            errors
        });
    }

    static unauthorized(res, message = "Unauthorized") {
        return res.status(401).json({
            success: false,
            message
        });
    }

    static forbidden(res, message = "Forbidden") {
        return res.status(403).json({
            success: false,
            message 
        });
    }

    static notFound(res, message = "Resource Not Found") {
        return res.status(404).json({
            success: false,
            message
        });
    }

    static validationError(res, errors, message = "Validation Error") {
        return res.status(422).json({
            success: false,
            message,
            errors
        });
    }

    static serverError(res, message = "Internal Server Error") {
        return res.status(500).json({
            success: false,
            message
        });
    }

}

module.exports = ApiResponse;