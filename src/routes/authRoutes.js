const express = require("express");
const authController = require("../controllers/authController");
const {
    registerValidator,
    loginValidator
} = require("../validators/authValidator");
const protect = require("../middlewares/protectMiddleware");
const validationMiddleware = require("../middlewares/validationMiddleware");

const router = express.Router();

router.post(
    "/register",
    registerValidator,
    validationMiddleware,
    authController.register
);

router.post(
    "/login",
    loginValidator,
    validationMiddleware,
    authController.login
);

router.get(
    "/me",
    protect,
    authController.getMe
);

module.exports = router;
