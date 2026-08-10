const express = require("express");
const authorController = require("../controllers/authorController");

const {
    createAuthorValidation
} = require("../validators/authorValidator");

const validationMiddleware = require("../../../shared/middlewares/validationMiddleware");
const protect = require("../../../shared/middlewares/protectMiddleware");
const authorize = require("../../../shared/middlewares/authorizeMiddleware");

const router = express.Router();


/**
 * @swagger
 * tags:
 *   name: Authors
 *   description: Author management endpoints
 */


/**
 * @swagger
 * /authors:
 *   get:
 *     summary: Get all authors
 *     tags: [Authors]
 *     responses:
 *       200:
 *         description: Authors fetched successfully
 */
router.get("/", authorController.getAllAuthors);


/**
 * @swagger
 * /authors/{id}:
 *   get:
 *     summary: Get single author
 *     tags: [Authors]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         example: 64f8c8b7e9a123456789abcd
 *     responses:
 *       200:
 *         description: Author fetched successfully
 *       404:
 *         description: Author not found
 */
router.get("/:id", authorController.getSingleAuthor);



/**
 * @swagger
 * /authors:
 *   post:
 *     summary: Create new author
 *     tags: [Authors]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *             properties:
 *               name:
 *                 type: string
 *                 example: Ahmed Mohamed
 *               email:
 *                 type: string
 *                 example: ahmed@test.com
 *               age:
 *                 type: integer
 *                 example: 35
 *               bio:
 *                 type: string
 *                 example: Famous writer
 *     responses:
 *       201:
 *         description: Author created successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.post(
    "/",
    createAuthorValidation,
    validationMiddleware,
    authorController.createAuthor
);



/**
 * @swagger
 * /authors/{id}:
 *   put:
 *     summary: Update author
 *     tags: [Authors]
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
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: Updated Author
 *               email:
 *                 type: string
 *                 example: updated@test.com
 *               age:
 *                 type: integer
 *                 example: 40
 *               bio:
 *                 type: string
 *                 example: Updated bio
 *     responses:
 *       200:
 *         description: Author updated successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.put(
    "/:id",
    authorController.updateAuthor
);



/**
 * @swagger
 * /authors/{id}:
 *   delete:
 *     summary: Delete author
 *     tags: [Authors]
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
 *         description: Author deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Author not found
 */
router.delete(
    "/:id",
    authorController.deleteAuthor
);


module.exports = router;