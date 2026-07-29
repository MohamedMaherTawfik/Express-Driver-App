const express = require("express");
const router = express.Router();
const { getAllAuthors , getSingleAuthor } = require("../controllers/authorController");

router.get("/", getAllAuthors);
router.get("/:id", getSingleAuthor);

module.exports = router;