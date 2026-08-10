const NotFoundError = require("../../../shared/errors/NotFoundError");

const authorRepository = require("../repositories/authorRepository");
const pick = require("../../../shared/helpers/pickHelper");
const logger = require("../../../shared/config/logger");

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
        const filteredData = pick(authorData, ["name", "email"]);
        const author = await authorRepository.create(filteredData);
        logger.info("Author created", {
            authorId: author._id.toString(),
            name: author.name
        });
        return author;
    }

    async update(id, authorData) {
        const filteredData = pick(authorData, ["name", "email"]);
        const author = await authorRepository.updateById(
            id,
            filteredData
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
        const filteredData = pick(author, ["name", "email"]);
        logger.info("Author deleted", {
            authorId: author._id.toString(),
            name: author.name
        });
        return author;
    }
}

module.exports = new AuthorService();