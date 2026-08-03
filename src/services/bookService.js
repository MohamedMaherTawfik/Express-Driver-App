const NotFoundError = require("../errors/NotFoundError");
const authorRepository = require("../repositories/authorRepository");
const bookRepository = require("../repositories/bookRepository");
const bookQueryHelper = require("../helpers/bookQueryHelper");
const cloudinaryService = require("./cloudinaryService");

class BookService {
    async getAll(query) {
        const filter = bookQueryHelper.buildFilter(query);
        const pagination = bookQueryHelper.buildPagination(query);
        const sort = bookQueryHelper.buildSort(query);

        const [books, totalItems] = await Promise.all([
            bookRepository.findAll({
                filter,
                sort,
                skip: pagination.skip,
                limit: pagination.limit
            }),
            bookRepository.count(filter)
        ]);

        return {
            books,
            meta: bookQueryHelper.buildPaginationMeta({
                page: pagination.page,
                limit: pagination.limit,
                totalItems
            })
        };
    }

    async getById(id) {
        const book = await bookRepository.findByIdWithAuthor(id);

        if (!book) {
            throw new NotFoundError("Book");
        }

        return book;
    }

    async create(bookData, file) {
        await this.ensureAuthorExists(bookData.author);

        const image = file
            ? await cloudinaryService.uploadImage(file)
            : null;

        return bookRepository.create({
            title: bookData.title,
            pages: bookData.pages,
            price: bookData.price,
            author: bookData.author,
            image
        });
    }

    async update(id, bookData, file) {
        const book = await bookRepository.findById(id);

        if (!book) {
            throw new NotFoundError("Book");
        }

        if (bookData.author) {
            await this.ensureAuthorExists(bookData.author);
        }

        const updateData = this.buildUpdateData(bookData);

        if (file) {
            updateData.image = await cloudinaryService.uploadImage(file);
            await this.deleteImageIfExists(book);
        }

        return bookRepository.updateById(id, updateData);
    }

    async delete(id) {
        const book = await bookRepository.findById(id);

        if (!book) {
            throw new NotFoundError("Book");
        }

        await this.deleteImageIfExists(book);
        await bookRepository.deleteById(id);
    }

    async ensureAuthorExists(authorId) {
        const author = await authorRepository.findById(authorId);

        if (!author) {
            throw new NotFoundError("Author");
        }
    }

    buildUpdateData(bookData) {
        const allowedFields = ["title", "pages", "price", "author"];

        return allowedFields.reduce((updateData, field) => {
            if (bookData[field] !== undefined) {
                updateData[field] = bookData[field];
            }

            return updateData;
        }, {});
    }

    async deleteImageIfExists(book) {
        if (!book.image?.public_id) {
            return;
        }

        await cloudinaryService.deleteImage(book.image.public_id);
    }
}

module.exports = new BookService();
