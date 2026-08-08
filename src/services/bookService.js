const NotFoundError = require("../errors/NotFoundError");

const authorRepository = require("../repositories/authorRepository");
const bookRepository = require("../repositories/bookRepository");
const pick = require("../helpers/pickHelper");
const bookQueryHelper = require("../helpers/bookQueryHelper");

const cloudinaryService = require("./cloudinaryService");

const logger = require("../config/logger");
const redisService = require("./redisService");
const {
    buildCacheKey
} = require("../helpers/cacheKeyHelper");

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

    async create(bookData, file) {
        await this.ensureAuthorExists(bookData.author);
        let image = null;
        if (file) {
            image = await cloudinaryService.uploadImage(file);
        }
        const filteredData = pick(bookData, ["title", "pages", "price", "author"]);
        if (image) {
            filteredData.image = image;
        }
        const book = await bookRepository.create(filteredData);
        await redisService.deleteByPrefix("books:list");
        logger.info("Book created", {
            bookId: book._id.toString(),
            title: book.title,
            authorId: book.author.toString()
        });
        return book;
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
        const updatedBook = await bookRepository.updateById(
            id,
            updateData
        );
        await redisService.deleteByPrefix("books:list");
        logger.info("Book updated", {
            bookId: updatedBook._id.toString(),
            title: updatedBook.title
        });
        return updatedBook;
    }

    async delete(id) {

        const book = await bookRepository.findById(id);

        if (!book) {
            throw new NotFoundError("Book");
        }

        await this.deleteImageIfExists(book);

        await bookRepository.deleteById(id);
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