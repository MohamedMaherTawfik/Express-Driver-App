module.exports = {
    User: {
        type: "object",
        properties: {
            id: {
                type: "string",
                example: "64f8c8b7e9a123456789abcd"
            },
            name: {
                type: "string",
                example: "Mohamed"
            },
            email: {
                type: "string",
                format: "email",
                example: "mohamed@test.com"
            },
            role: {
                type: "string",
                enum: ["user", "admin"],
                example: "user"
            }
        }
    },

    RegisterRequest: {
        type: "object",
        required: [
            "name",
            "email",
            "password"
        ],
        properties: {
            name: {
                type: "string",
                example: "Mohamed"
            },
            email: {
                type: "string",
                format: "email",
                example: "mohamed@test.com"
            },
            password: {
                type: "string",
                format: "password",
                example: "Password123!"
            }
        }
    },

    LoginRequest: {
        type: "object",
        required: [
            "email",
            "password"
        ],
        properties: {
            email: {
                type: "string",
                format: "email",
                example: "mohamed@test.com"
            },
            password: {
                type: "string",
                format: "password",
                example: "Password123!"
            }
        }
    },

    UserResponse: {
        type: "object",
        properties: {
            success: {
                type: "boolean",
                example: true
            },
            message: {
                type: "string",
                example: "Current User"
            },
            data: {
                $ref: "#/components/schemas/User"
            }
        }
    },

    RefreshTokenRequest: {
        type: "object",
        required: ["refreshToken"],
        properties: {
            refreshToken: {
                type: "string",
                example: "a8f4c9d2e7..."
            }
        }
    },

    RefreshTokenResponse: {
        type: "object",
        properties: {
            accessToken: {
                type: "string",
                example: "eyJhbGciOiJIUzI1NiIs..."
            },
            refreshToken: {
                type: "string",
                example: "a8f4c9d2e7..."
            }
        }
    }, 

    
};