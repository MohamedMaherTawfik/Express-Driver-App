const emailProducer = require("../queue/emailProducer");
const logger = require("../../shared/config/logger");

class EmailService {

    async sendEmail({
        to,
        subject,
        text,
        html,
        delay = 0,
        priority = 0
    }) {

        try {

            const job = await emailProducer.addEmailJob({
                to,
                subject,
                text,
                html,
                delay,
                priority
            });

            logger.info("Email job queued", {
                jobId: job.id,
                to,
                subject
            });

            return job;

        } catch (error) {

            logger.error("Email queue failed", {
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