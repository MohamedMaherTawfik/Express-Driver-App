const multer = require("multer");
const path = require("path");
const crypto = require("crypto");

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "src/uploads/images");
    },
    filename: (req, file, cb) => {
        const uniqueName =
            crypto.randomUUID() +
            path.extname(file.originalname);
        cb(null, uniqueName);
    }
});

const fileFilter = (req, file, cb) => {
    if (
        file.mimetype.startsWith("image/")
    ) {
        cb(null, true);
    } else {
        cb(
            new Error("Only images are allowed"),
            false
        );
    }
};

const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 2 * 1024 * 1024
    }
});

module.exports = upload;