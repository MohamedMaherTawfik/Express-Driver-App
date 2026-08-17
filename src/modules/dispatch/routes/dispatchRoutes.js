const express = require("express");
const router = express.Router();

const dispatchController = require("../controllers/dispatchController");
const {
    offerActionValidator,
    rejectOfferValidator,
} = require("../validators/dispatchValidator");

const protectMiddleware = require("../../../shared/middlewares/protectMiddleware");
const authorizeMiddleware = require("../../../shared/middlewares/authorizeMiddleware");
const requireDriverMiddleware = require("../../../shared/middlewares/requireDriverMiddleware");
const validationMiddleware = require("../../../shared/middlewares/validationMiddleware");

router.use(protectMiddleware);

router.post(
    "/offers/:id/accept",
    offerActionValidator,
    validationMiddleware,
    requireDriverMiddleware,
    dispatchController.acceptOffer
);

router.post(
    "/offers/:id/reject",
    rejectOfferValidator,
    validationMiddleware,
    requireDriverMiddleware,
    dispatchController.rejectOffer
);

router.post(
    "/offers/:id/expire",
    authorizeMiddleware("admin"),
    offerActionValidator,
    validationMiddleware,
    dispatchController.expireOffer
);

module.exports = router;
