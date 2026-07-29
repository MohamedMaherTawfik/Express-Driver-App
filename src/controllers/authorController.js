const Author = require("../models/Author");

const getAllAuthors = async (req, res) => {
    try {
        const authors = await Author.find();
        res.status(200).json({
            success: true,
            count: authors.length,
            data: authors
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

const getSingleAuthor = async (req, res) => {
    try {
        const author = await Author.findById(req.params.id);
        if(!author){
            return res.status(404).json({
            success: false,
            data: author
        });
        }
        res.status(200).json({
            success: true,
            data: author
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
}

module.exports = { getAllAuthors , getSingleAuthor };