const Categorey = require("../models/categorey");

class CategoryRepository {

    async getAll() {
        return await Categorey.find();
    }

    async getById(id) {
        return await Categorey.findById(id);
    }

    async getBySlug(slug) {
        return await Categorey.findOne({ slug: slug });
    }

    async create(category) {
        return await Categorey.create(category);
    }

    async update(id, category) {
        return await Categorey.findByIdAndUpdate(id, category, { new: true });
    }

    async delete(id) {
        return await Categorey.findByIdAndDelete(id);
    }
    async deleteAll() {
        return await Categorey.deleteMany({});
    }

}