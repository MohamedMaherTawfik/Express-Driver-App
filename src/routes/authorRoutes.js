const express = require("express");
const authorController = require("../controllers/authorController");
const {
    createAuthorValidation
} = require("../validators/authorValidator");
const validationMiddleware = require("../middlewares/validationMiddleware");
const protect = require("../middlewares/protectMiddleware");
const authorize = require("../middlewares/authorizeMiddleware");

const router = express.Router();

router.get("/", authorController.getAllAuthors);
router.get("/:id", authorController.getSingleAuthor);

router.use(protect, authorize("admin"));

router.post(
    "/",
    createAuthorValidation,
    validationMiddleware,
    authorController.createAuthor
);

router.put(
    "/:id",
    authorController.updateAuthor
);

router.delete(
    "/:id",
    authorController.deleteAuthor
);

module.exports = router;