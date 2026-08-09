const mongoose = require("mongoose");

const emailVerificationTokenSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            unique: true,
            index: true
        },

        tokenHash: {
            type: String,
            required: true,
            unique: true,
            index: true
        },

        expiresAt: {
            type: Date,
            required: true,
            index: true
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model(
    "EmailVerificationToken",
    emailVerificationTokenSchema
);