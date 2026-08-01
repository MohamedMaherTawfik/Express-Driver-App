const mongoose = require("mongoose");

const authorSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
            minlength: 3,
            maxlength: 100
        },

        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true
        },

        age: {
            type: Number,
            min: 18,
            max: 100
        },

        bio: {
            type: String,
            default: ""
        },

        isActive: {
            type: Boolean,
            default: true
        }
    },
    {
        timestamps: true
    }
);

authorSchema.virtual("books", {
    ref: "Book",
    localField: "_id",
    foreignField: "author"
});

authorSchema.set("toJSON", {
    virtuals: true
});

authorSchema.set("toObject", {
    virtuals: true
});
module.exports = mongoose.model("Author", authorSchema);