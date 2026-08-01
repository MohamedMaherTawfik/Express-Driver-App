const express = require("express");
const router = express.Router();

const { getAllAuthors , getSingleAuthor , createAuthor, updateAuthor, deleteAuthor} = require("../controllers/authorController");

const {
    createAuthorValidation
} = require("../validators/authorValidator");
const validationMiddleware = require("../middlewares/validationMiddleware");

router.get("/", getAllAuthors);
router.get("/:id", getSingleAuthor);
router.post("/" , createAuthorValidation , validationMiddleware , createAuthor);
router.put("/:id", updateAuthor);
router.delete("/:id", deleteAuthor);

module.exports = router;