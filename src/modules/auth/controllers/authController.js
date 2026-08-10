const authService = require("../services/authService");
const asyncHandler = require("../../../shared/utils/asyncHandler");
const ApiResponse = require("../../../shared/utils/response");
const emailVerificationService = require("../services/emailVerificationService");
const passwordResetService = require("../services/passwordResetService");

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

    forgotPassword = asyncHandler(async (req, res) => {

        await passwordResetService.forgotPassword(
            req.body.email
        );

        return ApiResponse.ok(
            res,
            null,
            "If the email exists, a password reset link has been sent"
        );
    });

    resetPassword = asyncHandler(async (req, res) => {

        await passwordResetService.resetPassword(
            req.body.token,
            req.body.password
        );

        return ApiResponse.ok(
            res,
            null,
            "Password reset successfully"
        );
    });
}

module.exports = new AuthController();