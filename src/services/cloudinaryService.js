const cloudinary = require("../config/cloudinary");
const streamifier = require("streamifier");

class CloudinaryService {
    uploadImage(file, folder = "books") {
        return new Promise((resolve, reject) => {
            const stream = cloudinary.uploader.upload_stream(
                {
                    folder
                },
                (error, result) => {
                    if (error) {
                        return reject(error);
                    }
                    resolve({
                        url: result.secure_url,
                        public_id: result.public_id
                    });
                }
            );
            streamifier.createReadStream(file.buffer).pipe(stream);
        });
    }
    async deleteImage(publicId) {
        return await cloudinary.uploader.destroy(publicId);
    }
}

module.exports = new CloudinaryService();