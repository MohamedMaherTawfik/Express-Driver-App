const mongoose = require("mongoose");

const bookSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true,
        minlength: 3,
        maxlength: 50
    },

    pages: {
        type: Number
    },

    price: {
        type: Number
    },

    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Author",
        required: true
    }
},

    {
        timestamps: true
    }
);

module.exports = mongoose.model("Book", bookSchema);