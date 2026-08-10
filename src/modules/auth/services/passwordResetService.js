const crypto = require("crypto");

const BadRequestError = require("../../../shared/errors/BadRequestError");
const UnauthorizedError = require("../../../shared/errors/UnauthorizedError");
const refreshTokenRepository = require(
    "../repositories/refreshTokenRepository"
);
const passwordResetEmail = require(
    "../templates/emails/passwordResetEmail"
);
const userRepository = require("../../users/repositories/userRepository");
const passwordResetTokenRepository = require(
    "../repositories/passwordResetTokenRepository"
);
const emailService = require("../../../infrastructure/email/emailService");
const logger = require("../../../shared/config/logger");

class PasswordResetService {

    generateToken() {

        const token = crypto
            .randomBytes(32)
            .toString("hex");

        const tokenHash = crypto
            .createHash("sha256")
            .update(token)
            .digest("hex");

        const expiresAt = new Date(
            Date.now() + 15 * 60 * 1000
        );

        return {
            token,
            tokenHash,
            expiresAt
        };
    }

    async forgotPassword(email) {

        const user = await userRepository.findByEmail(email);

        /*
         * Security:
         * Don't reveal whether the email exists.
         */

        if (!user) {

            logger.warn("Password reset requested", {
                email,
                reason: "User not found"
            });

            return;
        }

        await passwordResetTokenRepository.deleteByUserId(
            user._id
        );

        const {
            token,
            tokenHash,
            expiresAt
        } = this.generateToken();

        await passwordResetTokenRepository.create({
            user: user._id,
            tokenHash,
            expiresAt
        });

        const resetUrl =
            `${process.env.CLIENT_URL}/reset-password?token=${token}`;

        const emailContent = passwordResetEmail({
            name: user.name,
            resetUrl
        });

        await emailService.sendEmail({
            to: user.email,
            ...emailContent
        });

        logger.info("Password reset email sent", {
            userId: user._id.toString()
        });
    }

    async resetPassword(token, newPassword) {

        if (!token) {
            throw new UnauthorizedError(
                "Reset token is required"
            );
        }

        const tokenHash = crypto
            .createHash("sha256")
            .update(token)
            .digest("hex");

        const storedToken =
            await passwordResetTokenRepository.findByTokenHash(
                tokenHash
            );

        if (!storedToken) {
            throw new UnauthorizedError(
                "Invalid or expired reset token"
            );
        }

        if (storedToken.expiresAt <= new Date()) {

            await passwordResetTokenRepository.deleteById(
                storedToken._id
            );

            throw new UnauthorizedError(
                "Invalid or expired reset token"
            );
        }

        const user = await userRepository.findById(
            storedToken.user
        );

        if (!user) {
            throw new UnauthorizedError(
                "User no longer exists"
            );
        }

        user.password = newPassword;

        await user.save();
        await refreshTokenRepository.revokeAllByUserId(
            user._id
        );

        await passwordResetTokenRepository.deleteById(
            storedToken._id
        );

        logger.info("Password reset successfully", {
            userId: user._id.toString(),
            email: user.email
        });

        return user;
    }

}

module.exports = new PasswordResetService();