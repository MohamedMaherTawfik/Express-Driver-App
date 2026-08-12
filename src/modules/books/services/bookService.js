const NotFoundError = require("../../../shared/errors/NotFoundError");

const authorRepository = require("../../authors/repositories/authorRepository");
const bookRepository = require("../repositories/bookRepository");
const pick = require("../../../shared/helpers/pickHelper");
const bookQueryHelper = require("../helpers/bookQueryHelper");
const notificationService = require("../../notifications/services/notificationService");
const userRepository = require("../../users/repositories/userRepository");
const cloudinaryService = require("../../../infrastructure/cloudinary/cloudinaryService");
const logger = require("../../../shared/config/logger");
const redisService = require("../../../infrastructure/redis/redisService");
const {
    buildCacheKey
} = require("../../../shared/helpers/cacheKeyHelper");


class BookService {

    async getAll(query) {
        const filter = bookQueryHelper.buildFilter(query);
        const pagination = bookQueryHelper.buildPagination(query);
        const sort = bookQueryHelper.buildSort(query);
        const cacheKey = buildCacheKey(
            "books:list",
            {
                filter,
                page: pagination.page,
                limit: pagination.limit,
                sort
            }
        );
        const result = await redisService.getOrSet(
            cacheKey,
            async () => {
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
            },
            60
        );
        return result.data;
    }

    async getById(id) {
        const book = await bookRepository.findByIdWithAuthor(id);
        if (!book) {
            throw new NotFoundError("Book");
        }
        return book;
    }

    async create(bookData, file, userId) {
        await this.ensureAuthorExists(bookData.author);

        let image = null;

        if (file) {
            image = await cloudinaryService.uploadImage(file);
        }

        const filteredData = pick(
            bookData,
            ["title", "pages", "price", "author"]
        );

        if (image) {
            filteredData.image = image;
        }

        const book = await bookRepository.create(filteredData);

        await notificationService.createNotification({
            userId,
            type: "book_created",
            title: "Book Created",
            message: `The book "${book.title}" was created successfully.`,
            data: {
                bookId: book._id.toString()
            }
        });

        await redisService.deleteByPrefix("books:list");

        logger.info("Book created", {
            bookId: book._id.toString(),
            title: book.title,
            authorId: book.author.toString()
        });

        return book;
    }

    async update(id, bookData, file, userId) {
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
        const updatedBook = await bookRepository.updateById(
            id,
            updateData
        );

        await notificationService.createNotification({
            userId,
            type: "book_updated",
            title: "Book Updated",
            message: `The book "${updatedBook.title}" was updated successfully.`,
            data: {
                bookId: updatedBook._id.toString()
            }
        });

        await redisService.deleteByPrefix("books:list");
        logger.info("Book updated", {
            bookId: updatedBook._id.toString(),
            title: updatedBook.title
        });
        return updatedBook;
    }

    async delete(id, userId) {

        const book = await bookRepository.findById(id);

        if (!book) {
            throw new NotFoundError("Book");
        }

        await this.deleteImageIfExists(book);

        await bookRepository.deleteById(id);

        await notificationService.createNotification({
            userId,
            type: "book_deleted",
            title: "Book Deleted",
            message: `The book "${book.title}" was deleted successfully.`,
            data: {
                bookId: book._id.toString()
            }
        });

        await redisService.deleteByPrefix("books:list");
        logger.info("Book deleted", {
            bookId: book._id.toString(),
            title: book.title
        });

    }

    async ensureAuthorExists(authorId) {

        const author = await authorRepository.findById(authorId);

        if (!author) {
            throw new NotFoundError("Author");
        }

    }

    buildUpdateData(bookData) {

        const allowedFields = [
            "title",
            "pages",
            "price",
            "author"
        ];

        return allowedFields.reduce((data, field) => {

            if (bookData[field] !== undefined) {
                data[field] = bookData[field];
            }

            return data;

        }, {});

    }

    async deleteImageIfExists(book) {

        if (!book.image?.public_id) {
            return;
        }

        await cloudinaryService.deleteImage(
            book.image.public_id
        );

    }

}

module.exports = new BookService();