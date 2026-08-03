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
}

module.exports = new UserRepository();
