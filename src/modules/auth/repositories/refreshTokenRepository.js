const RefreshToken = require("../models/RefreshToken");

class RefreshTokenRepository {

    async create(data) {
        return await RefreshToken.create(data);
    }

    async findByTokenHash(tokenHash) {
        return await RefreshToken.findOne({
            tokenHash
        });
    }

    async revokeById(id) {
        return await RefreshToken.findByIdAndUpdate(
            id,
            {
                revokedAt: new Date()
            },
            {
                new: true
            }
        );
    }

    async revokeByTokenHash(tokenHash) {
        return await RefreshToken.findOneAndUpdate(
            {
                tokenHash,
                revokedAt: null
            },
            {
                revokedAt: new Date()
            },
            {
                new: true
            }
        );
    }

    async revokeFamily(familyId) {
        return await RefreshToken.updateMany(
            {
                familyId,
                revokedAt: null
            },
            {
                revokedAt: new Date()
            }
        );
    }

    async revokeAllByUserId(userId) {
        return await RefreshToken.updateMany(
            {
                user: userId,
                revokedAt: null
            },
            {
                revokedAt: new Date()
            }
        );
    }
}

module.exports = new RefreshTokenRepository();