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


    VerifyEmailRequest: {
        type: "object",
        required: ["token"],
        properties: {
            token: {
                type: "string",
                example: "a1b2c3d4e5f6..."
            }
        }
    },

    ResendVerificationRequest: {
        type: "object",
        required: ["email"],
        properties: {
            email: {
                type: "string",
                format: "email",
                example: "mohamed@test.com"
            }
        }
    },

    ForgotPasswordRequest: {
        type: "object",
        required: ["email"],
        properties: {
            email: {
                type: "string",
                format: "email",
                example: "mohamed@test.com"
            }
        }
    },

    ResetPasswordRequest: {
        type: "object",
        required: ["token", "password"],
        properties: {
            token: {
                type: "string",
                example: "a1b2c3d4e5f6..."
            },
            password: {
                type: "string",
                format: "password",
                minLength: 8,
                example: "NewPassword123!"
            }
        }
    },

    /**
 * @swagger
 * components:
 *   schemas:
 *     Category:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           example: 66b123456789abcdef123456
 *         name:
 *           type: string
 *           minLength: 3
 *           maxLength: 50
 *           example: Electronics
 *         description:
 *           type: string
 *           maxLength: 1000
 *           example: Electronic devices and accessories
 *         image:
 *           type: string
 *           nullable: true
 *           example: https://example.com/images/electronics.jpg
 *         slug:
 *           type: string
 *           example: electronics
 *         isDeleted:
 *           type: boolean
 *           example: false
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *
 *     CategoryInput:
 *       type: object
 *       required:
 *         - name
 *       properties:
 *         name:
 *           type: string
 *           minLength: 3
 *           maxLength: 50
 *           example: Electronics
 *         description:
 *           type: string
 *           maxLength: 1000
 *           example: Electronic devices and accessories
 *         image:
 *           type: string
 *           nullable: true
 *           example: https://example.com/images/electronics.jpg
 */


};