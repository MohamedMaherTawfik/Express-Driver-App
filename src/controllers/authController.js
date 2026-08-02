const jwt = require("jsonwebtoken");
const User = require("../models/User");
const asyncHandler = require("../utils/asyncHandler");
const ApiResponse = require("../utils/response");

const register = asyncHandler(async (req, res) => {
    const { name, email, password } = req.body;
    const userExists = await User.findOne({ email });
    if (userExists) {
        return ApiResponse.badRequest(res, "Email already exists");
    }
    const user = await User.create({
        name,
        email,
        password
    });
    ApiResponse.created(
        res,
        user,
        "User registered successfully"
    );
});

const login = asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    const user = await User.findOne({ email }).select("+password");
    if (!user) {
        return ApiResponse.unauthorized(
            res,
            "Invalid email or password"
        );
    }
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
        return ApiResponse.unauthorized(
            res,
            "Invalid email or password"
        );
    }
    const token = jwt.sign(
        {
            id: user._id,
            role: user.role
        },
        process.env.JWT_SECRET,
        {
            expiresIn: process.env.JWT_EXPIRES_IN
        }
    );
    user.password = undefined;
    return ApiResponse.ok(
        res,
        {
            user,
            token
        },
        "Login Successfully"
    );
});

const getMe = asyncHandler(async (req, res) => {

    return ApiResponse.ok(
        res,
        req.user,
        "Current User"
    );

});

module.exports = {
    register,
    login,
    getMe
};