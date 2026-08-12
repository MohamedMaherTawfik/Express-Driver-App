const NotFoundError = require("../../../shared/errors/NotFoundError");

const userRepository = require("../repositories/userRepository");

class UserService {
    async getById(id) {
        const user = await userRepository.findById(id);

        if (!user) {
            throw new NotFoundError("User");
        }

        return user;
    }

    async getByEmail(email) {
        return userRepository.findByEmail(email);
    }

    async getByEmailWithPassword(email) {
        return userRepository.findByEmailWithPassword(email);
    }

    async create(userData) {
        return userRepository.create(userData);
    }

    async markEmailAsVerified(userId) {
        const user =
            await userRepository.markEmailAsVerified(userId);

        if (!user) {
            throw new NotFoundError("User");
        }

        return user;
    }
}

module.exports = new UserService();