const Author = require("../models/Author");

class AuthorRepository {
    async findAll() {
        return await Author.find();
    }

    async findById(id) {
        return await Author.findById(id);
    }

    async findByIdWithBooks(id) {
        return await Author.findById(id).populate({
            path: "books",
            select: "title pages price"
        });
    }

    async create(authorData) {
        return await Author.create(authorData);
    }

    async updateById(id, authorData) {
        return await Author.findByIdAndUpdate(id, authorData, {
            new: true,
            runValidators: true
        });
    }

    async deleteById(id) {
        return await Author.findByIdAndDelete(id);
    }
}

module.exports = new AuthorRepository();
