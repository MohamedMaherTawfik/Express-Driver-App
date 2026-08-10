const PasswordResetToken = require("../models/PasswordResetToken");

class PasswordResetTokenRepository {

    async create(data) {
        return await PasswordResetToken.create(data);
    }

    async findByTokenHash(tokenHash) {
        return await PasswordResetToken.findOne({
            tokenHash
        });
    }

    async deleteByUserId(userId) {
        return await PasswordResetToken.deleteMany({
            user: userId
        });
    }

    async deleteById(id) {
        return await PasswordResetToken.findByIdAndDelete(id);
    }

}

module.exports = new PasswordResetTokenRepository();