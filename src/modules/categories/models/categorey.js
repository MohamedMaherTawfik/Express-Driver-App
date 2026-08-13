const mongoose = require("mongoose");

const categorySchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
            minlength: 3,
            maxlength: 50
        },

        description: {
            type: String,
            trim: true,
            maxlength: 1000,
            default: "No description"
        },

        isDeleted: {
            type: Boolean,
            default: false
        },

        image: {
            type: String,
            default: null
        },

        slug: {
            type: String,
            unique: true,
            index: true,
            lowercase: true,
            default: null
        }
    },
    {
        timestamps: true
    }
);

categorySchema.pre("save", function (next) {
    if (this.isModified("name")) {
        this.slug = this.name
            .trim()
            .toLowerCase()
            .replace(/\s+/g, "-")
            .replace(/[^\p{L}\p{N}-]/gu, "")
            .replace(/-+/g, "-")
            .replace(/^-|-$/g, "");
    }

    next();
});

module.exports = mongoose.model("Category", categorySchema);