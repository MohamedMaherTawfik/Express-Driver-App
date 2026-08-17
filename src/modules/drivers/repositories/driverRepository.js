const Driver = require("../models/driver");

class DriverRepository {

    async create(data, options = {}) {
        if (options.session) {
            const [driver] = await Driver.create([data], {
                session: options.session,
            });
            return driver;
        }
        return Driver.create(data);
    }

    async findById(id) {
        return Driver.findById(id)
            .populate("user", "name email")
            .populate("application")
            .populate("vehicle");
    }

    async findByUserId(userId) {
        return Driver.findOne({ user: userId })
            .populate("user", "name email")
            .populate("application")
            .populate("vehicle");
    }

    async existsByUserId(userId) {
        return Driver.exists({ user: userId });
    }

    async updateById(id, data) {
        return Driver.findByIdAndUpdate(id, data, {
            new: true,
            runValidators: true,
        });
    }

    async deleteById(id) {
        return Driver.findByIdAndDelete(id);
    }
}

module.exports = new DriverRepository();
