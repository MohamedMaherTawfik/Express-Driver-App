const userService = require("../services/userService");
const asyncHandler = require("../../../shared/utils/asyncHandler");
const ApiResponse = require("../../../shared/utils/response");

class UserController {
    getById = asyncHandler(async (req, res) => {
        const user = await userService.getById(req.params.id);

        return ApiResponse.ok(
            res,
            user,
            "User fetched successfully"
        );
    });

    getByEmail = asyncHandler(async (req, res) => {
        const user = await userService.getByEmail(
            req.params.email
        );

        return ApiResponse.ok(
            res,
            user,
            "User fetched successfully"
        );
    });
}

module.exports = new UserController();