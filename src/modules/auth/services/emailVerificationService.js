const crypto = require("crypto");

const emailVerificationTokenRepository = require("../repositories/emailVerificationTokenRepository");
const emailService = require("../../../infrastructure/email/emailService");
const userRepository = require("../../users/repositories/userRepository");
const UnauthorizedError = require("../../../shared/errors/UnauthorizedError");
const logger = require("../../../shared/config/logger");
const BadRequestError = require("../../../shared/errors/BadRequestError");

class EmailVerificationService {

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

    async createVerificationToken(user) {

        await emailVerificationTokenRepository.deleteByUserId(
            user._id
        );

        const {
            token,
            tokenHash,
            expiresAt
        } = this.generateToken();

        await emailVerificationTokenRepository.create({
            user: user._id,
            tokenHash,
            expiresAt
        });

        return token;
    }

    async verifyEmail(token) {

        if (!token) {
            throw new UnauthorizedError(
                "Verification token is required"
            );
        }

        const tokenHash = crypto
            .createHash("sha256")
            .update(token)
            .digest("hex");

        const storedToken =
            await emailVerificationTokenRepository.findByTokenHash(
                tokenHash
            );

        if (!storedToken) {
            throw new UnauthorizedError(
                "Invalid verification token"
            );
        }

        if (storedToken.expiresAt <= new Date()) {

            await emailVerificationTokenRepository.deleteById(
                storedToken._id
            );

            throw new UnauthorizedError(
                "Verification token has expired"
            );
        }

        const user =
            await userRepository.markEmailAsVerified(
                storedToken.user
            );

        if (!user) {
            throw new UnauthorizedError(
                "User no longer exists"
            );
        }

        await emailVerificationTokenRepository.deleteById(
            storedToken._id
        );

        logger.info("Email verified", {
            userId: user._id.toString(),
            email: user.email
        });

        return user;
    }
    async sendVerificationEmail(user) {

        const token = await this.createVerificationToken(user);

        const verificationUrl =
            `${process.env.CLIENT_URL}/verify-email?token=${token}`;

        await emailService.sendEmail({

            to: user.email,

            subject: "Verify your email",

            text: `
Hello ${user.name},

Please verify your email by opening this link:

${verificationUrl}

This link expires in 15 minutes.
            `.trim(),

            html: `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Verify Email</title>
</head>

<body style="font-family: Arial, sans-serif;">

    <h2>Hello ${user.name}!</h2>

    <p>
        Please verify your email address.
    </p>

    <p>
        <a href="${verificationUrl}">
            Verify Email
        </a>
    </p>

    <p>
        This link expires in 15 minutes.
    </p>

</body>
</html>
            `.trim()

        });

        logger.info("Verification email sent", {
            userId: user._id.toString(),
            email: user.email
        });
    }

    async resendVerificationEmail(email) {

        const user = await userRepository.findByEmail(email);

        if (!user) {
            throw new UnauthorizedError(
                "Unable to process verification request"
            );
        }

        if (user.isEmailVerified) {
            throw new BadRequestError(
                "Email is already verified"
            );
        }

        await this.sendVerificationEmail(user);

        logger.info("Verification email resent", {
            userId: user._id.toString(),
            email: user.email
        });
    }
}

module.exports = new EmailVerificationService();