const jwt = require("jsonwebtoken");
const crypto = require("crypto");

const BadRequestError = require("../errors/BadRequestError");
const UnauthorizedError = require("../errors/UnauthorizedError");

const pick = require("../helpers/pickHelper");

const userRepository = require("../repositories/userRepository");
const refreshTokenRepository = require("../repositories/refreshTokenRepository");

const logger = require("../config/logger");

class AuthService {

    async register(userData) {

        const existingUser = await userRepository.findByEmail(
            userData.email
        );

        if (existingUser) {

            logger.warn("Register failed", {
                email: userData.email,
                reason: "Email already exists"
            });

            throw new BadRequestError(
                "Email already exists"
            );

        }

        const filteredData = pick(
            userData,
            ["name", "email", "password"]
        );

        const user = await userRepository.create(filteredData);

        logger.info("User registered", {
            userId: user._id.toString(),
            email: user.email,
            role: user.role
        });

        return user;

    }


    async login({ email, password }) {

        const user = await userRepository.findByEmailWithPassword(
            email
        );

        if (!user) {

            logger.warn("Login failed", {
                email,
                reason: "User not found"
            });

            throw new UnauthorizedError(
                "Invalid email or password"
            );

        }

        const passwordMatches = await user.comparePassword(
            password
        );

        if (!passwordMatches) {

            logger.warn("Login failed", {
                email,
                userId: user._id.toString(),
                reason: "Wrong password"
            });

            throw new UnauthorizedError(
                "Invalid email or password"
            );

        }

        const accessToken = this.generateAccessToken(user);

        const familyId = crypto.randomUUID();

        const {
            refreshToken,
            refreshTokenHash,
            expiresAt
        } = this.generateRefreshToken();

        await refreshTokenRepository.create({
            user: user._id,
            tokenHash: refreshTokenHash,
            familyId,
            expiresAt
        });

        user.password = undefined;

        logger.info("User logged in", {
            userId: user._id.toString(),
            email: user.email,
            role: user.role
        });

        return {
            user,
            accessToken,
            refreshToken
        };

    }


    async getAuthenticatedUser(token) {

        if (!token) {

            logger.warn("Authentication failed", {
                reason: "Token not provided"
            });

            throw new UnauthorizedError(
                "You are not logged in"
            );

        }

        const decodedToken = this.verifyAccessToken(token);

        const user = await userRepository.findById(
            decodedToken.sub
        );

        if (!user) {

            logger.warn("Authentication failed", {
                userId: decodedToken.sub,
                reason: "User not found"
            });

            throw new UnauthorizedError(
                "User no longer exists"
            );

        }

        return user;

    }


    generateAccessToken(user) {

        return jwt.sign(
            {
                sub: user._id.toString(),
                role: user.role
            },
            process.env.JWT_SECRET,
            {
                algorithm: "HS256",
                issuer: process.env.JWT_ISSUER,
                audience: process.env.JWT_AUDIENCE,
                expiresIn: process.env.JWT_EXPIRES_IN
            }
        );

    }


    verifyAccessToken(token) {

        return jwt.verify(
            token,
            process.env.JWT_SECRET,
            {
                algorithms: ["HS256"],
                issuer: process.env.JWT_ISSUER,
                audience: process.env.JWT_AUDIENCE
            }
        );

    }


    generateRefreshToken() {

        const refreshToken = crypto.randomBytes(64).toString("hex");

        const refreshTokenHash = crypto
            .createHash("sha256")
            .update(refreshToken)
            .digest("hex");

        const expiresAt = new Date(
            Date.now() +
            Number(process.env.REFRESH_TOKEN_EXPIRES_DAYS) *
            24 *
            60 *
            60 *
            1000
        );

        return {
            refreshToken,
            refreshTokenHash,
            expiresAt
        };

    }

    async refreshAccessToken(refreshToken) {

        if (!refreshToken) {
            throw new UnauthorizedError(
                "Refresh token is required"
            );
        }

        const refreshTokenHash = crypto
            .createHash("sha256")
            .update(refreshToken)
            .digest("hex");

        const storedToken =
            await refreshTokenRepository.findByTokenHash(
                refreshTokenHash
            );

        if (!storedToken) {

            logger.warn("Refresh token failed", {
                reason: "Token not found"
            });

            throw new UnauthorizedError(
                "Invalid refresh token"
            );
        }

        /*
         * Refresh Token Reuse Detection
         */

        if (storedToken.revokedAt) {

            logger.warn("Refresh token reuse detected", {
                userId: storedToken.user.toString(),
                familyId: storedToken.familyId
            });

            await refreshTokenRepository.revokeFamily(
                storedToken.familyId
            );

            throw new UnauthorizedError(
                "Refresh token reuse detected. Please login again."
            );
        }

        /*
         * Expiration check
         */

        if (storedToken.expiresAt <= new Date()) {

            logger.warn("Refresh token failed", {
                userId: storedToken.user.toString(),
                reason: "Token expired"
            });

            throw new UnauthorizedError(
                "Refresh token has expired"
            );
        }

        const user = await userRepository.findById(
            storedToken.user
        );

        if (!user) {

            throw new UnauthorizedError(
                "User no longer exists"
            );
        }

        /*
         * Revoke old refresh token
         */

        await refreshTokenRepository.revokeById(
            storedToken._id
        );

        /*
         * Generate new tokens
         */

        const accessToken =
            this.generateAccessToken(user);

        const {
            refreshToken: newRefreshToken,
            refreshTokenHash: newRefreshTokenHash,
            expiresAt
        } = this.generateRefreshToken();

        /*
         * Keep same token family
         */

        await refreshTokenRepository.create({
            user: user._id,
            tokenHash: newRefreshTokenHash,
            familyId: storedToken.familyId,
            expiresAt
        });

        logger.info("Refresh token rotated", {
            userId: user._id.toString(),
            familyId: storedToken.familyId
        });

        return {
            accessToken,
            refreshToken: newRefreshToken
        };
    }

    async logout(refreshToken) {

        if (!refreshToken) {

            throw new UnauthorizedError(
                "Refresh token is required"
            );

        }

        const refreshTokenHash = crypto
            .createHash("sha256")
            .update(refreshToken)
            .digest("hex");

        const revokedToken =
            await refreshTokenRepository.revokeByTokenHash(
                refreshTokenHash
            );

        if (!revokedToken) {

            throw new UnauthorizedError(
                "Invalid refresh token"
            );

        }

        logger.info("User logged out", {
            userId: revokedToken.user.toString()
        });

    }
}


module.exports = new AuthService();