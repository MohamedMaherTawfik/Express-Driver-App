const Book = require("../models/Book");
const Author = require("../models/Author");
const asyncHandler = require("../utils/asyncHandler");
const apiResponse = require("../utils/response");
const ApiResponse = require("../utils/response");
const ApiFeatures = require("../utils/apiFeatures");
const cloudinaryService = require("../services/cloudinaryService");

const getAllBook = asyncHandler(async (req, res) => {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const total = await Book.countDocuments();
    const features = new ApiFeatures(
        Book.find().populate("author", "name"),
        req.query
    )
        .filter()
        .search()
        .sort()
        .paginate();
    const books = await features.query;
    return res.status(200).json({
        success: true,
        message: "Books fetched successfully",
        pagination: {
            currentPage: page,
            perPage: limit,
            totalItems: total,
            totalPages: Math.ceil(total / limit),
            hasNextPage: page < Math.ceil(total / limit),
            hasPrevPage: page > 1
        },
        data: books
    });
});

const getSingleBook = asyncHandler(async (req, res) => {
    const book = await Book.findById(req.params.id).populate("author");
    if (!book) {
        throw new AppError("book not found", 404);
    }
    apiResponse.ok(res, book, "Book fetched Successfully")
});

const createBook = asyncHandler(async (req, res) => {
    const author = await Author.findById(req.body.author);
    if (!author) {
        return ApiResponse.notFound(res, "Author not found");
    }
    let image = null;
    if (req.file) {
        image = await cloudinaryService.uploadImage(req.file);
    }
    const book = await Book.create({
        title: req.body.title,
        pages: req.body.pages,
        price: req.body.price,
        author: req.body.author,
        image
    });
    return ApiResponse.created(
        res,
        book,
        "Book Created Successfully"
    );
});

const updateBook = asyncHandler(async (req, res) => {
    const book = await Book.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true
    });
    if (!book) {
        apiResponse.notFound(res, "Book Not found")
    }
    apiResponse.ok(res, book, "Book Updated Successfully")
});

const deleteBook = asyncHandler(async (req, res) => {
    const book = await Book.findByIdAndDelete(req.params.id);
    if (!book) {
        return apiResponse.notFound(res, "Book not found");
    }
    apiResponse.ok(res, book, "Book Deleted Successfully");
});

module.exports = { getAllBook, getSingleBook, createBook, updateBook, deleteBook };