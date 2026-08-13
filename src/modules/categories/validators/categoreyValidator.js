const { body } = require("express-validator");

const createCategoryValidator = [
    body("name")
        .trim()
        .notEmpty()
        .withMessage("Name is required")
        .isLength({ min: 3, max: 100 })
        .withMessage("Name must be between 3 and 100 characters"),
    
    body("description")
        .trim()
        .optional()
        .isLength({ max: 1000 })
        .withMessage("Description must be at most 1000 characters"),

    body("image")
        .optional()
        .isString()
        .withMessage("Image must be a string"),
];

const updateCategoryValidator = [
    body("name")
        .trim()
        .optional()
        .isLength({ min: 3, max: 100 })
        .withMessage("Name must be between 3 and 100 characters"),
    
    body("description")
        .trim()
        .optional()
        .isLength({ max: 1000 })
        .withMessage("Description must be at most 1000 characters"),

    body("image")
        .optional()
        .isString()
        .withMessage("Image must be a string"),
];

module.exports = { createCategoryValidator , updateCategoryValidator };