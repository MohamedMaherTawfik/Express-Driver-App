const NotFoundError = require("../errors/NotFoundError");
const authorRepository = require("../repositories/authorRepository");

class AuthorService {
    getAll() {
        return authorRepository.findAll();
    }

    async getById(id) {
        const author = await authorRepository.findByIdWithBooks(id);

        if (!author) {
            throw new NotFoundError("Author");
        }

        return author;
    }

    create(authorData) {
        return authorRepository.create(authorData);
    }

    async update(id, authorData) {
        const author = await authorRepository.updateById(id, authorData);

        if (!author) {
            throw new NotFoundError("Author");
        }

        return author;
    }

    async delete(id) {
        const author = await authorRepository.deleteById(id);

        if (!author) {
            throw new NotFoundError("Author");
        }

        return author;
    }
}

module.exports = new AuthorService();
