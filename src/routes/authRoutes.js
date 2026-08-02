const express = require("express");

const router = express.Router();

const {
    register ,
    login,
    getMe   
} = require("../controllers/authController");

const {
    registerValidator ,
    loginValidator
} = require("../validators/authValidator");
const { protect } = require("../middlewares/authMiddleware");
const validationMiddleware = require("../middlewares/validationMiddleware");

router.post(
    "/register",
    registerValidator,
    validationMiddleware,
    register
);

router.post(
    "/login",
    loginValidator,
    validationMiddleware,
    login
);

router.get(
    "/me",
    protect,
    getMe
);  

module.exports = router;