const cloudinary = require("../config/cloudinary");
const streamifier = require("streamifier");

const logger = require("../config/logger");

class CloudinaryService {

    uploadImage(file, folder = "books") {

        return new Promise((resolve, reject) => {

            const uploadStream = cloudinary.uploader.upload_stream(
                {
                    folder,
                    resource_type: "image",
                    overwrite: false,
                    unique_filename: true,
                    allowed_formats: [
                        "jpg",
                        "jpeg",
                        "png",
                        "webp"
                    ]
                },
                (error, result) => {

                    if (error) {

                        logger.error("Cloudinary upload failed", {
                            message: error.message,
                            folder
                        });

                        return reject(error);

                    }

                    logger.info("Image uploaded", {
                        publicId: result.public_id,
                        folder
                    });

                    resolve({
                        url: result.secure_url,
                        public_id: result.public_id
                    });

                }
            );

            streamifier
                .createReadStream(file.buffer)
                .pipe(uploadStream);

        });

    }

    async deleteImage(publicId) {

        if (!publicId) {
            return;
        }

        const result = await cloudinary.uploader.destroy(publicId);

        logger.info("Image deleted", {
            publicId,
            result: result.result
        });

        return result;

    }

}

module.exports = new CloudinaryService();