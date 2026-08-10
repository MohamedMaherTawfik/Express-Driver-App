const Book = require("../models/Book");

class BookRepository {
    async findAll({ filter = {}, sort = "-createdAt", skip = 0, limit = 10 }) {
        return await Book.find(filter)
            .populate("author", "name")
            .sort(sort)
            .skip(skip)
            .limit(limit);
    }

    async count(filter = {}) {
        return await Book.countDocuments(filter);
    }

    async findById(id) {
        return await Book.findById(id);
    }

    async findByIdWithAuthor(id) {
        return await Book.findById(id).populate("author", "name");
    }

    async create(bookData) {
        return await Book.create(bookData);
    }

    async updateById(id, bookData) {
        return await Book.findByIdAndUpdate(id, bookData, {
            new: true,
            runValidators: true
        });
    }

    async deleteById(id) {
        return await Book.findByIdAndDelete(id);
    }
}

module.exports = new BookRepository();
