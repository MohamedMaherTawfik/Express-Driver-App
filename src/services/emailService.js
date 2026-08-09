const mail = require("../config/mail");
const logger = require("../config/logger");

class EmailService {

    async sendEmail({
        to,
        subject,
        text,
        html
    }) {

        try {

            const info = await mail.sendMail({

                from: process.env.MAIL_FROM,

                to,

                subject,

                text,

                html

            });

            logger.info("Email sent", {
                messageId: info.messageId,
                to,
                subject
            });

            return info;

        } catch (error) {

            logger.error("Email sending failed", {
                to,
                subject,
                message: error.message,
                stack: error.stack
            });

            throw error;
        }
    }

}

module.exports = new EmailService();