const express = require("express");

const bookController = require("../controllers/bookControllers");

const {
    createBookValidator
} = require("../validators/bookValidator");

const protect = require("../middlewares/protectMiddleware");
const authorize = require("../middlewares/authorizeMiddleware");
const upload = require("../middlewares/uploadMiddleware");
const validationMiddleware = require("../middlewares/validationMiddleware");

const validateImage = require("../validators/imageValidator");

const router = express.Router();


/**
 * @swagger
 * tags:
 *   name: Books
 *   description: Book management endpoints
 */


/**
 * @swagger
 * /books:
 *   get:
 *     summary: Get all books
 *     tags: [Books]
 *     responses:
 *       200:
 *         description: Books fetched successfully
 */
router.get("/", bookController.getAllBook);


/**
 * @swagger
 * /books/{id}:
 *   get:
 *     summary: Get single book
 *     tags: [Books]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         example: 64f8c8b7e9a123456789abcd
 *     responses:
 *       200:
 *         description: Book fetched successfully
 *       404:
 *         description: Book not found
 */
router.get("/:id", bookController.getSingleBook);



/**
 * @swagger
 * /books:
 *   post:
 *     summary: Create new book
 *     tags: [Books]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - author
 *             properties:
 *               title:
 *                 type: string
 *                 example: Clean Code
 *               pages:
 *                 type: integer
 *                 example: 400
 *               price:
 *                 type: number
 *                 example: 25.99
 *               author:
 *                 type: string
 *                 example: 64f8c8b7e9a123456789abcd
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: Book created successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.post(
    "/",
    upload.single("image"),
    validateImage,
    createBookValidator,
    validationMiddleware,
    bookController.createBook
);



/**
 * @swagger
 * /books/{id}:
 *   put:
 *     summary: Update book
 *     tags: [Books]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         example: 64f8c8b7e9a123456789abcd
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 example: Updated Book
 *               pages:
 *                 type: integer
 *                 example: 500
 *               price:
 *                 type: number
 *                 example: 30
 *               author:
 *                 type: string
 *                 example: 64f8c8b7e9a123456789abcd
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Book updated successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Book not found
 */
router.put(
    "/:id",
    upload.single("image"),
    validateImage,
    bookController.updateBook
);



/**
 * @swagger
 * /books/{id}:
 *   delete:
 *     summary: Delete book
 *     tags: [Books]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         example: 64f8c8b7e9a123456789abcd
 *     responses:
 *       200:
 *         description: Book deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Book not found
 */
router.delete(
    "/:id",
    bookController.deleteBook
);


module.exports = router;