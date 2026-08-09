const express = require("express");

const authController = require("../controllers/authController");
const loginRateLimiter = require("../middlewares/loginRateLimiter");
const registerRateLimiter = require("../middlewares/registerRateLimiter");
const refreshTokenRateLimiter = require("../middlewares/refreshTokenRateLimiter");
const resendVerificationRateLimiter = require(
    "../middlewares/resendVerificationRateLimiter"
);
const {
    registerValidator,
    loginValidator,
    refreshTokenValidator,
    verifyEmailValidator,
    resendVerificationEmailValidator
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
    registerRateLimiter,
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
    loginRateLimiter,
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
    refreshTokenRateLimiter,
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

/**
 * @swagger
 * /api/auth/verify-email:
 *   post:
 *     summary: Verify user email
 *     description: Verifies the user's email address using the verification token sent by email.
 *     tags: [Authentication]
 *
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/VerifyEmailRequest'
 *
 *     responses:
 *       200:
 *         description: Email verified successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserResponse'
 *
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.post(
    "/verify-email",
    verifyEmailValidator,
    validationMiddleware,
    authController.verifyEmail
);

/**
 * @swagger
 * /api/auth/resend-verification:
 *   post:
 *     summary: Resend verification email
 *     description: Sends a new email verification token to the user.
 *     tags: [Authentication]
 *
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ResendVerificationRequest'
 *
 *     responses:
 *       200:
 *         description: Verification email sent successfully
 *
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *
 *       429:
 *         description: Too many verification email requests
 */
router.post(
    "/resend-verification",
    resendVerificationRateLimiter,
    resendVerificationEmailValidator,
    validationMiddleware,
    authController.resendVerificationEmail
);

module.exports = router;