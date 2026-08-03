const jwt = require("jsonwebtoken");

const BadRequestError = require("../errors/BadRequestError");
const UnauthorizedError = require("../errors/UnauthorizedError");

const userRepository = require("../repositories/userRepository");
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

        const user = await userRepository.create(userData);

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

        const token = this.generateToken(user);

        user.password = undefined;

        logger.info("User logged in", {
            userId: user._id.toString(),
            email: user.email,
            role: user.role
        });

        return {
            user,
            token
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

        const decodedToken = this.verifyToken(token);

        const user = await userRepository.findById(
            decodedToken.id
        );

        if (!user) {

            logger.warn("Authentication failed", {
                userId: decodedToken.id,
                reason: "User not found"
            });

            throw new UnauthorizedError(
                "User no longer exists"
            );

        }

        return user;

    }

    generateToken(user) {

        return jwt.sign(
            {
                id: user._id,
                role: user.role
            },
            process.env.JWT_SECRET,
            {
                expiresIn: process.env.JWT_EXPIRES_IN
            }
        );

    }

    verifyToken(token) {

        return jwt.verify(
            token,
            process.env.JWT_SECRET
        );

    }

}

module.exports = new AuthService();