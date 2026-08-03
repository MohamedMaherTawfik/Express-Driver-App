const { body } = require("express-validator");

const registerValidator = [

    body("name")
        .trim()
        .notEmpty()
        .withMessage("Name is required")
        .isLength({ min: 3, max: 100 })
        .withMessage("Name must be between 3 and 100 characters")
        .escape(),

    body("email")
        .trim()
        .normalizeEmail()
        .notEmpty()
        .withMessage("Email is required")
        .isEmail()
        .withMessage("Invalid email"),

    body("password")
        .notEmpty()
        .withMessage("Password is required")
        .isLength({ min: 8 })
        .withMessage("Password must be at least 8 characters")
        .matches(/[a-z]/)
        .withMessage("Password must contain a lowercase letter")
        .matches(/[A-Z]/)
        .withMessage("Password must contain an uppercase letter")
        .matches(/[0-9]/)
        .withMessage("Password must contain a number")
        .matches(/[!@#$%^&*(),.?":{}|<>]/)
        .withMessage("Password must contain a special character")

];

const loginValidator = [

    body("email")
        .trim()
        .normalizeEmail()
        .notEmpty()
        .withMessage("Email is required")
        .isEmail()
        .withMessage("Invalid email"),

    body("password")
        .notEmpty()
        .withMessage("Password is required")

];

module.exports = {
    registerValidator,
    loginValidator
};