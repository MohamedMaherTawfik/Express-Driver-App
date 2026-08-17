const { body, param } = require("express-validator");

const objectIdParam = (name) => (
    param(name)
        .isMongoId()
        .withMessage(`${name} must be a valid ObjectId.`)
);

const orderDispatchValidator = [
    objectIdParam("id"),
];

const offerActionValidator = [
    objectIdParam("id"),
];

const rejectOfferValidator = [
    objectIdParam("id"),
    body("reason")
        .optional({ nullable: true })
        .trim()
        .isLength({ max: 500 })
        .withMessage("Rejection reason cannot exceed 500 characters."),
];

module.exports = {
    orderDispatchValidator,
    offerActionValidator,
    rejectOfferValidator,
};
