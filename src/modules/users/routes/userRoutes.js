const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const protectMiddleware = require("../../../shared/middlewares/protectMiddleware");
const authorizeMiddleware = require("../../../shared/middlewares/authorizeMiddleware");

// Both routes require authentication and admin privileges since they fetch other users' data
router.use(protectMiddleware);
router.use(authorizeMiddleware("admin"));

router.get("/:id", userController.getById);
router.get("/email/:email", userController.getByEmail);

module.exports = router;
