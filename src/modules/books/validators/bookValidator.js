const { body } = require("express-validator");

const createBookValidator = [

    body("title")
        .trim()
        .notEmpty()
        .withMessage("Title is required")
        .isLength({ min: 3, max: 200 })
        .withMessage("Title must be between 3 and 200 characters"),

    body("pages")
        .optional()
        .isInt({ min: 1 })
        .withMessage("Pages must be a positive integer"),

    body("price")
        .optional()
        .isFloat({ min: 0 })
        .withMessage("Price must be a positive number"),

    body("author")
        .notEmpty()
        .withMessage("Author is required")
        .isMongoId()
        .withMessage("Invalid author id")

];

module.exports = {
    createBookValidator
};