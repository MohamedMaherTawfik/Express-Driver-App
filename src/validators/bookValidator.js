const { body } = require("express-validator");

const createBookValidator = [
    body("title")
        .notEmpty()
        .withMessage("title is required")
        .isLength({ min: 3 })
        .withMessage("title must be at least 3 characters"),

    body("pages")
        .optional()
        .isNumeric()
        .withMessage("pages Must Be Number"),

    body("price")
        .optional()
        .isNumeric()
        .withMessage("price Must Be Number"),

    body("author")
        .notEmpty()
        .withMessage("Author is required")
        .custom(value => mongoose.Types.ObjectId.isValid(value))
        .withMessage("Invalid author id"),
];

module.exports = {
    createBookValidator
}; 