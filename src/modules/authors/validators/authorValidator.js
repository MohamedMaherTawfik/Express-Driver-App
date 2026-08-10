const { body } = require("express-validator");

const createAuthorValidation = [

    body("name")
        .trim()
        .notEmpty()
        .withMessage("Name is required")
        .isLength({ min: 3, max: 100 })
        .withMessage("Name must be between 3 and 100 characters"),

    body("bio")
        .optional()
        .trim()
        .isLength({ max: 1000 })
        .withMessage("Bio must not exceed 1000 characters"),

    body("email")
        .trim()
        .normalizeEmail()
        .notEmpty()
        .withMessage("Email is required")
        .isEmail()
        .withMessage("Invalid email"),

    body("age")
        .optional()
        .isInt({ min: 18, max: 120 })
        .withMessage("Age must be between 18 and 120")

];

module.exports = {
    createAuthorValidation
};