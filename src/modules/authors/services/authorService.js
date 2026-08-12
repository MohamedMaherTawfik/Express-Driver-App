const NotFoundError = require("../../../shared/errors/NotFoundError");

const authorRepository = require("../repositories/authorRepository");
const pick = require("../../../shared/helpers/pickHelper");
const logger = require("../../../shared/config/logger");
const notificationService = require("../../notifications/services/notificationService");

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

    async create(authorData, userId) {
        const filteredData = pick(authorData, ["name", "email"]);
        const author = await authorRepository.create(filteredData);

        await notificationService.createNotification({
            userId,
            type: "author_created",
            title: "Author Created",
            message: `The author "${author.name}" was created successfully.`,
            data: {
                authorId: author._id.toString()
            }
        });

        logger.info("Author created", {
            authorId: author._id.toString(),
            name: author.name
        });
        return author;
    }

    async update(id, authorData, userId) {
        const filteredData = pick(authorData, ["name", "email"]);
        const author = await authorRepository.updateById(
            id,
            filteredData
        );
        if (!author) {
            throw new NotFoundError("Author");
        }

        await notificationService.createNotification({
            userId,
            type: "author_updated",
            title: "Author Updated",
            message: `The author "${author.name}" was updated successfully.`,
            data: {
                authorId: author._id.toString()
            }
        });

        logger.info("Author updated", {
            authorId: author._id.toString(),
            name: author.name
        });
        return author;
    }

    async delete(id, userId) {
        const author = await authorRepository.deleteById(id);
        if (!author) {
            throw new NotFoundError("Author");
        }
        const filteredData = pick(author, ["name", "email"]);

        await notificationService.createNotification({
            userId,
            type: "author_deleted",
            title: "Author Deleted",
            message: `The author "${author.name}" was deleted successfully.`,
            data: {
                authorId: author._id.toString()
            }
        });

        logger.info("Author deleted", {
            authorId: author._id.toString(),
            name: author.name
        });
        return author;
    }
}

module.exports = new AuthorService();