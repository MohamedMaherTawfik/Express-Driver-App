const NotFoundError = require("../errors/NotFoundError");

const authorRepository = require("../repositories/authorRepository");

const logger = require("../config/logger");

class AuthorService {

    async getAll() {

        return await authorRepository.findAll();

    }

    async getById(id) {

        const author = await authorRepository.findByIdWithBooks(id);

        if (!author) {
            throw new NotFoundError("Author");
        }

        return author;

    }

    async create(authorData) {

        const author = await authorRepository.create(authorData);

        logger.info("Author created", {
            authorId: author._id.toString(),
            name: author.name
        });

        return author;

    }

    async update(id, authorData) {

        const author = await authorRepository.updateById(
            id,
            authorData
        );

        if (!author) {
            throw new NotFoundError("Author");
        }

        logger.info("Author updated", {
            authorId: author._id.toString(),
            name: author.name
        });

        return author;

    }

    async delete(id) {

        const author = await authorRepository.deleteById(id);

        if (!author) {
            throw new NotFoundError("Author");
        }

        logger.info("Author deleted", {
            authorId: author._id.toString(),
            name: author.name
        });

        return author;

    }

}

module.exports = new AuthorService();