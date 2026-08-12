const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true
        },

        type: {
            type: String,
            required: true,
            trim: true,
            maxlength: 100
        },

        title: {
            type: String,
            required: true,
            trim: true,
            maxlength: 255
        },

        message: {
            type: String,
            required: true,
            trim: true,
            maxlength: 1000
        },

        data: {
            type: mongoose.Schema.Types.Mixed,
            default: () => ({})
        },

        readAt: {
            type: Date,
            default: null,
            index: true
        }
    },
    {
        timestamps: true,
        versionKey: false
    }
);

/*
|--------------------------------------------------------------------------
| Indexes
|--------------------------------------------------------------------------
*/

notificationSchema.index({
    user: 1,
    createdAt: -1
});

notificationSchema.index({
    user: 1,
    readAt: 1,
    createdAt: -1
});

module.exports = mongoose.model(
    "Notification",
    notificationSchema
);