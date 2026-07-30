const express = require("express");
const router = express.Router();
const { getAllAuthors , getSingleAuthor , createAuthor, updateAuthor, deleteAuthor} = require("../controllers/authorController");

router.get("/", getAllAuthors);
router.get("/:id", getSingleAuthor);
router.post("/", createAuthor);
router.put("/:id", updateAuthor);
router.delete("/:id", deleteAuthor);

module.exports = router;