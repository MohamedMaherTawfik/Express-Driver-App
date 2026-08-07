module.exports = {
    Unauthorized: {
        description: "Invalid or missing authentication token"
    },

    Forbidden: {
        description: "User does not have permission"
    },

    NotFound: {
        description: "Resource not found"
    },

    ValidationError: {
        description: "Validation failed"
    },

    Conflict: {
        description: "Resource already exists"
    },

    InternalServerError: {
        description: "Internal server error"
    }
};