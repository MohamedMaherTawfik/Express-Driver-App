const mongoose = require("mongoose");

/**
 * Simple auto-increment counter for generating human-readable order numbers.
 * Uses findOneAndUpdate + $inc for atomic, race-condition-safe increments.
 */
const counterSchema = new mongoose.Schema(
    {
        _id: { type: String, required: true },
        seq: { type: Number, default: 0 },
    },
    { versionKey: false }
);

module.exports = mongoose.model("Counter", counterSchema);
