const express = require("express");
const bookController = require("../controllers/bookControllers");
const {
    createBookValidator
} = require("../validators/bookValidator");
const protect = require("../middlewares/protectMiddleware");
const authorize = require("../middlewares/authorizeMiddleware");
const upload = require("../middlewares/uploadMiddleware");
const validationMiddleware = require("../middlewares/validationMiddleware");

const router = express.Router();

router.get("/", bookController.getAllBook);
router.get("/:id", bookController.getSingleBook);

router.use(protect, authorize("admin"));

router.post(
    "/",
    upload.single("image"),
    createBookValidator,
    validationMiddleware,
    bookController.createBook
);

router.put(
    "/:id",
    upload.single("image"),
    bookController.updateBook
);

router.delete(
    "/:id",
    bookController.deleteBook
);

module.exports = router;
