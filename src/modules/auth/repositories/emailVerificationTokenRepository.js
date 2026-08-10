const EmailVerificationToken = require("../models/EmailVerificationToken");

class EmailVerificationTokenRepository {

    async create(data) {
        return await EmailVerificationToken.create(data);
    }

    async findByTokenHash(tokenHash) {
        return await EmailVerificationToken.findOne({
            tokenHash
        });
    }

    async findByUserId(userId) {
        return await EmailVerificationToken.findOne({
            user: userId
        });
    }

    async deleteByUserId(userId) {
        return await EmailVerificationToken.deleteOne({
            user: userId
        });
    }

    async deleteById(id) {
        return await EmailVerificationToken.findByIdAndDelete(id);
    }

}

module.exports = new EmailVerificationTokenRepository();