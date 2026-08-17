const Vehicle = require("../models/vehicle");

class VehicleRepository {
    async create(data, options = {}) {
        if (options.session) {
            const [vehicle] = await Vehicle.create([data], {
                session: options.session,
            });
            return vehicle;
        }
        return Vehicle.create(data);
    }

    async findById(id) {
        return Vehicle.findById(id).populate({
            path: "driver",
            populate: {
                path: "user",
                select: "name email",
            },
        });
    }

    async findByDriverId(driverId) {
        return Vehicle.findOne({ driver: driverId });
    }

    async findOne(filter) {
        return Vehicle.findOne(filter);
    }

    async exists(filter) {
        return Vehicle.exists(filter);
    }

    async updateById(id, data, options = {}) {
        return Vehicle.findByIdAndUpdate(id, data, {
            new: true,
            runValidators: true,
            session: options.session,
        });
    }

    async deleteById(id) {
        return Vehicle.findByIdAndDelete(id);
    }

    async findMany({ filter = {}, sort = { createdAt: -1 }, skip = 0, limit = 10 }) {
        const query = Vehicle.find(filter)
            .populate({
                path: "driver",
                populate: {
                    path: "user",
                    select: "name email",
                },
            })
            .sort(sort)
            .skip(skip)
            .limit(limit);

        const items = await query;
        const total = await Vehicle.countDocuments(filter);

        return { items, total };
    }
}

module.exports = new VehicleRepository();
