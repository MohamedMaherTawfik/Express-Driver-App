const Author = require("../models/Author");
const asyncHandler = require("../utils/asyncHandler");

const getAllAuthors = asyncHandler(async (req, res) => {
    const authors = await Author.find();
    res.status(200).json({
        success: true,
        data: authors
    });
})

const getSingleAuthor = asyncHandler(async (req, res) => {
    const author = await Author.findById(req.params.id)
        .populate({
            path: "books",
            select: "title pages price"
        });
    if (!author) {
        throw new AppError("Author not found", 404);
    }
    res.status(200).json({
        success: true,
        data: author
    });
})

const createAuthor = asyncHandler(async (req, res) => {
    const author = await Author.create(req.body);
    res.status(201).json({
        success: true,
        data: author
    });
})

const updateAuthor = asyncHandler(async (req, res) => {
    const author = await Author.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true
    });
    if (!author) {
        return res.status(404).json({
            success: false,
            message: "Author not found"
        });
    }
    res.status(200).json({
        success: true,
        data: author
    });
})

const deleteAuthor = asyncHandler(async (req, res) => {
    const author = await Author.findByIdAndDelete(req.params.id);
    if (!author) {
        return res.status(404).json({
            success: false,
            message: "Author not found"
        });
    }
    res.status(200).json({
        success: true,
        data: author
    });
})

module.exports = { getAllAuthors, getSingleAuthor, createAuthor, updateAuthor, deleteAuthor };