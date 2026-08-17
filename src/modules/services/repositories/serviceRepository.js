const Service = require("../models/service");

class ServiceRepository {
    async create(data, options = {}) {
        if (options.session) {
            const [service] = await Service.create([data], {
                session: options.session,
            });
            return service;
        }
        return Service.create(data);
    }

    async findById(id) {
        return Service.findById(id);
    }

    async findBySlug(slug) {
        return Service.findOne({ slug: slug.toLowerCase() });
    }

    async findOne(filter) {
        return Service.findOne(filter);
    }

    async exists(filter) {
        return Service.exists(filter);
    }

    async updateById(id, data, options = {}) {
        return Service.findByIdAndUpdate(id, data, {
            new: true,
            runValidators: true,
            session: options.session,
        });
    }

    async deleteById(id) {
        return Service.findByIdAndDelete(id);
    }

    async findMany({ filter = {}, sort = { createdAt: -1 }, skip = 0, limit = 10 }) {
        const query = Service.find(filter)
            .sort(sort)
            .skip(skip)
            .limit(limit);

        const items = await query;
        const total = await Service.countDocuments(filter);

        return { items, total };
    }
}

module.exports = new ServiceRepository();
