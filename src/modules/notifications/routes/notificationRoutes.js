const express = require("express");

const notificationController = require("../controllers/notificationController");
const protect = require("../../../shared/middlewares/protectMiddleware");

const router = express.Router();

router.post(
    "/test",
    protect,
    notificationController.sendTestNotification
);

module.exports = router;