const express = require("express");

const categoryController = require("../controllers/categoreyController");
const protect = require("../../../shared/middlewares/protectMiddleware");
const validationMiddleware = require("../../../shared/middlewares/validationMiddleware");
const rateLimiter = require("../../../shared/middlewares/rateLimiter");

const {
    createCategoryValidator,
    updateCategoryValidator
} = require("../validators/categoreyValidator");

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Categories
 *   description: Category management
 */

/**
 * @swagger
 * /categories:
 *   post:
 *     summary: Create a new category
 *     tags: [Categories]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CategoryInput'
 *     responses:
 *       201:
 *         description: Category created successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       409:
 *         description: Category already exists
 */
router.post(
    "/",
    rateLimiter,
    protect,
    createCategoryValidator,
    validationMiddleware,
    categoryController.createCategory
);

/**
 * @swagger
 * /categories:
 *   get:
 *     summary: Get all categories
 *     tags: [Categories]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Categories retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get(
    "/",
    rateLimiter,
    protect,
    categoryController.getAll
);

/**
 * @swagger
 * /categories/{id}:
 *   get:
 *     summary: Get category by ID
 *     tags: [Categories]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Category MongoDB ObjectId
 *     responses:
 *       200:
 *         description: Category retrieved successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Category not found
 */
router.get(
    "/:id",
    rateLimiter,
    protect,
    categoryController.getCategoryById
);

/**
 * @swagger
 * /categories/slug/{slug}:
 *   get:
 *     summary: Get category by slug
 *     tags: [Categories]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *         example: electronics
 *     responses:
 *       200:
 *         description: Category retrieved successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Category not found
 */
router.get(
    "/slug/:slug",
    rateLimiter,
    protect,
    categoryController.getCategoryBySlug
);

/**
 * @swagger
 * /categories/{id}:
 *   put:
 *     summary: Update category
 *     tags: [Categories]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Category MongoDB ObjectId
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CategoryInput'
 *     responses:
 *       200:
 *         description: Category updated successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Category not found
 */
router.put(
    "/:id",
    rateLimiter,
    protect,
    updateCategoryValidator,
    validationMiddleware,
    categoryController.updateCategory
);

/**
 * @swagger
 * /categories/{id}:
 *   delete:
 *     summary: Delete category
 *     tags: [Categories]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Category deleted successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Category not found
 */
router.delete(
    "/:id",
    rateLimiter,
    protect,
    categoryController.deleteCategory
);

/**
 * @swagger
 * /categories:
 *   delete:
 *     summary: Delete all categories
 *     tags: [Categories]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: All categories deleted successfully
 *       401:
 *         description: Unauthorized
 */
router.delete(
    "/",
    rateLimiter,
    protect,
    categoryController.deleteAllCategories
);

module.exports = router;