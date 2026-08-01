const express = require("express");
const router = express.Router();

const { getAllBook, getSingleBook, createBook, updateBook, deleteBook } = require("../controllers/bookControllers");
const {
    createBookValidator
} = require("../validators/bookValidator");
const validationMiddleware = require("../middlewares/validationMiddleware");


router.get("/", getAllBook);
router.get("/:id", getSingleBook);
router.post("/"  , createBookValidator , validationMiddleware , createBook);
router.put("/:id", updateBook);
router.delete("/:id", deleteBook);

module.exports = router;