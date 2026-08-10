const bookService = require("../services/bookService");
const asyncHandler = require("../../../shared/utils/asyncHandler");
const ApiResponse = require("../../../shared/utils/response");

class BookController {
    getAllBook = asyncHandler(async (req, res) => {
        const { books, meta } = await bookService.getAll(req.query);

        return ApiResponse.ok(
            res,
            books,
            "Books fetched successfully",
            meta
        );
    });

    getSingleBook = asyncHandler(async (req, res) => {
        const book = await bookService.getById(req.params.id);

        return ApiResponse.ok(
            res,
            book,
            "Book fetched successfully"
        );
    });

    createBook = asyncHandler(async (req, res) => {
        const book = await bookService.create(req.body, req.file);

        return ApiResponse.created(
            res,
            book,
            "Book created successfully"
        );
    });

    updateBook = asyncHandler(async (req, res) => {
        const book = await bookService.update(req.params.id, req.body, req.file);

        return ApiResponse.ok(
            res,
            book,
            "Book updated successfully"
        );
    });

    deleteBook = asyncHandler(async (req, res) => {
        await bookService.delete(req.params.id);

        return ApiResponse.noContent(res);
    });
}

module.exports = new BookController();
