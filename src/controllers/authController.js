const authService = require("../services/authService");
const asyncHandler = require("../utils/asyncHandler");
const ApiResponse = require("../utils/response");

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
}

module.exports = new AuthController();