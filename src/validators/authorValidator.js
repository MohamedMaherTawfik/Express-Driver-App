const { body } = require("express-validator");

const createAuthorValidation = [
    body("name")
        .notEmpty()
        .withMessage("Name is required")
        .isLength({ min: 3 })
        .withMessage("Name must be at least 3 characters"),

    body("email")
        .notEmpty()
        .withMessage("Email is required")
        .isEmail()
        .withMessage("Invalid email"),

    body("age")
        .optional()
        .isInt({ min: 18 })
        .withMessage("Age must be at least 18")
];

module.exports = {
    createAuthorValidation
}; 