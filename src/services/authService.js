const jwt = require("jsonwebtoken");
const BadRequestError = require("../errors/BadRequestError");
const UnauthorizedError = require("../errors/UnauthorizedError");
const userRepository = require("../repositories/userRepository");

class AuthService {
    async register(userData) {
        const existingUser = await userRepository.findByEmail(userData.email);

        if (existingUser) {
            throw new BadRequestError("Email already exists");
        }

        return userRepository.create(userData);
    }

    async login({ email, password }) {
        const user = await userRepository.findByEmailWithPassword(email);

        if (!user) {
            throw new UnauthorizedError("Invalid email or password");
        }

        const passwordMatches = await user.comparePassword(password);

        if (!passwordMatches) {
            throw new UnauthorizedError("Invalid email or password");
        }

        const token = this.generateToken(user);
        user.password = undefined;

        return {
            user,
            token
        };
    }

    async getAuthenticatedUser(token) {
        if (!token) {
            throw new UnauthorizedError("You are not logged in");
        }

        const decodedToken = this.verifyToken(token);
        const user = await userRepository.findById(decodedToken.id);

        if (!user) {
            throw new UnauthorizedError("User no longer exists");
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
        return jwt.verify(token, process.env.JWT_SECRET);
    }
}

module.exports = new AuthService();
