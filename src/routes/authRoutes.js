const express = require("express");

const authController = require("../controllers/authController");

const {
    registerValidator,
    loginValidator,
    refreshTokenValidator
} = require("../validators/authValidator");

const protect = require("../middlewares/protectMiddleware");
const validationMiddleware = require("../middlewares/validationMiddleware");

const router = express.Router();


/**
 * @swagger
 * tags:
 *   name: Authentication
 *   description: Authentication endpoints
 */


/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register new user
 *     tags: [Authentication]
 *
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegisterRequest'
 *
 *     responses:
 *       201:
 *         description: User registered successfully
 *
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 */
router.post(
    "/register",
    registerValidator,
    validationMiddleware,
    authController.register
);


/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login user
 *     tags: [Authentication]
 *
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *
 *     responses:
 *       200:
 *         description: Login successfully
 *
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.post(
    "/login",
    loginValidator,
    validationMiddleware,
    authController.login
);



/**
 * @swagger
 * /api/auth/refresh:
 *   post:
 *     summary: Refresh access token
 *     description: Generates a new access token and rotates the refresh token.
 *     tags: [Authentication]
 *
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RefreshTokenRequest'
 *
 *     responses:
 *       200:
 *         description: Access token refreshed successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RefreshTokenResponse'
 *
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.post(
    "/refresh",
    refreshTokenValidator,
    validationMiddleware,
    authController.refreshToken
);

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Get current logged user
 *     tags: [Authentication]
 *
 *     security:
 *       - bearerAuth: []
 *
 *     responses:
 *       200:
 *         description: Current user returned successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserResponse'
 *
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get(
    "/me",
    protect,
    authController.getMe
);


/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: Logout user
 *     description: Revokes the provided refresh token and ends the current session.
 *     tags: [Authentication]
 *
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RefreshTokenRequest'
 *
 *     responses:
 *       200:
 *         description: Logged out successfully
 *
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.post(
    "/logout",
    refreshTokenValidator,
    validationMiddleware,
    authController.logout
);

module.exports = router;