const Book = require("../models/Book");
const Author = require("../models/Author");
const asyncHandler = require("../utils/asyncHandler");
const apiResponse = require("../utils/response");
const ApiResponse = require("../utils/response");

const getAllBook = asyncHandler(async (req, res) => {
    const books = await Book.find();
    apiResponse.ok(res, books, "Books Fetched Successfully")
});


const getSingleBook = asyncHandler(async (req, res) => {
    const book = await Book.findById(req.params.id);
    if (!book) {
        throw new AppError("book not found", 404);
    }
    apiResponse.ok(res, book, "Book fetched Successfully")
});

const createBook = asyncHandler(async (req, res) => {

    const author = await Author.findById(req.body.author);
    if (!author) {
        return apiResponse.notFound(res, "Author not found");
    }
    const book = await Book.create(req.body);
    apiResponse.created(res, book, "Book Created Successfully")
});

const updateBook = asyncHandler(async (req,res) => {
    const book = await Book.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });
        if (!book) {
            apiResponse.notFound(res , "Book Not found")
        }
    apiResponse.ok(res,book , "Book Updated Successfully")
});

const deleteBook = asyncHandler(async (req, res) => {
    const book = await Book.findByIdAndDelete(req.params.id);
    if (!book) {
        return apiResponse.notFound(res, "Book not found");
    }
    apiResponse.ok(res, book, "Book Deleted Successfully");
});

module.exports = { getAllBook, getSingleBook, createBook, updateBook, deleteBook };