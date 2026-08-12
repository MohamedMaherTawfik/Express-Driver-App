const authorService = require("../services/authorService");
const asyncHandler = require("../../../shared/utils/asyncHandler");
const ApiResponse = require("../../../shared/utils/response");

class AuthorController {
    getAllAuthors = asyncHandler(async (req, res) => {
        const authors = await authorService.getAll();

        return ApiResponse.ok(res, authors);
    });

    getSingleAuthor = asyncHandler(async (req, res) => {
        const author = await authorService.getById(req.params.id);

        return ApiResponse.ok(res, author);
    });

    createAuthor = asyncHandler(async (req, res) => {
        const author = await authorService.create(req.body, req.user.id);

        return ApiResponse.created(res, author);
    });

    updateAuthor = asyncHandler(async (req, res) => {
        const author = await authorService.update(req.params.id, req.body, req.user.id);

        return ApiResponse.ok(res, author);
    });

    deleteAuthor = asyncHandler(async (req, res) => {
        const author = await authorService.delete(req.params.id, req.user.id);

        return ApiResponse.ok(res, author);
    });
}

module.exports = new AuthorController();
