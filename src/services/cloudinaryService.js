const cloudinary = require("../config/cloudinary");
const streamifier = require("streamifier");
const logger = require("../config/logger");

class CloudinaryService {

    uploadImage(file, folder = "books") {

        return new Promise((resolve, reject) => {

            const uploadStream = cloudinary.uploader.upload_stream(
                {
                    folder
                },
                (error, result) => {

                    if (error) {

                        logger.error("Cloudinary upload failed", {
                            message: error.message,
                            stack: error.stack
                        });

                        return reject(error);
                    }

                    logger.info("Image uploaded", {
                        publicId: result.public_id,
                        folder,
                        url: result.secure_url
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

        const result = await cloudinary.uploader.destroy(publicId);

        logger.info("Image deleted", {
            publicId,
            result: result.result
        });

        return result;

    }

}

module.exports = new CloudinaryService();