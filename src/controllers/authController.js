const authService = require("../services/authService");
const asyncHandler = require("../utils/asyncHandler");
const ApiResponse = require("../utils/response");
const emailVerificationService = require("../services/emailVerificationService");

class AuthController {
    register = asyncHandler(async (req, res) => {
        const user = await authService.register(
            req.body
        );
        return ApiResponse.created(
            res,
            user,
            "User registered successfully"
        );
    });
    login = asyncHandler(async (req, res) => {
        const loginResult = await authService.login(
            req.body
        );
        return ApiResponse.ok(
            res,
            loginResult,
            "Login Successfully"
        );
    });


    getMe = asyncHandler(async (req, res) => {
        return ApiResponse.ok(
            res,
            req.user,
            "Current User"
        );
    });
    refreshToken = asyncHandler(async (req, res) => {
        const result = await authService.refreshAccessToken(
            req.body.refreshToken
        );
        return ApiResponse.ok(
            res,
            result,
            "Access token refreshed successfully"
        );
    });

    logout = asyncHandler(async (req, res) => {
        await authService.logout(
            req.body.refreshToken
        );
        return ApiResponse.ok(
            res,
            null,
            "Logged out successfully"
        );
    });

    verifyEmail = asyncHandler(async (req, res) => {
        const user = await emailVerificationService.verifyEmail(
            req.body.token
        );
        return ApiResponse.ok(
            res,
            user,
            "Email verified successfully"
        );
    });

    resendVerificationEmail = asyncHandler(async (req, res) => {

        await emailVerificationService.resendVerificationEmail(
            req.body.email
        );

        return ApiResponse.ok(
            res,
            null,
            "Verification email sent successfully"
        );
    });
}

module.exports = new AuthController();