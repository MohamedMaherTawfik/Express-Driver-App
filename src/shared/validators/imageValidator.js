const { fileTypeFromBuffer } = require("file-type");

const BadRequestError = require("../errors/BadRequestError");

const allowedMimeTypes = [
    "image/jpeg",
    "image/png",
    "image/webp"
];

const validateImage = async (req, res, next) => {
    if (!req.file) {
        return next();
    }
    const fileType = await fileTypeFromBuffer(
        req.file.buffer
    );
    if (!fileType) {
        return next(
            new BadRequestError("Invalid image")
        );
    }
    if (!allowedMimeTypes.includes(fileType.mime)) {
        return next(
            new BadRequestError(
                "Only JPEG, PNG and WEBP images are allowed"
            )
        );
    }
    next();
};
module.exports = validateImage;