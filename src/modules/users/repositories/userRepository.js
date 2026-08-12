const User = require("../models/User");

class UserRepository {
    async findById(id) {
        return await User.findById(id);
    }

    async findByEmail(email) {
        return await User.findOne({ email });
    }

    async findByEmailWithPassword(email) {
        return await User.findOne({ email }).select("+password");
    }

    async create(userData) {
        return await User.create(userData);
    }

    async markEmailAsVerified(userId) {
        return await User.findByIdAndUpdate(
            userId,
            {
                isEmailVerified: true
            },
            {
                new: true
            }
        );
    }

    async findAllIds() {
        return await User
            .find({}, { _id: 1 })
            .lean();
    }
}

module.exports = new UserRepository();
