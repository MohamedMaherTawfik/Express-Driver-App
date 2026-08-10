const { Worker } = require("bullmq");

const connection = require("./redisConnection");
const transporter = require("../email/mail");

const emailWorker = new Worker(
    "email",
    async (job) => {
        const {
            to,
            subject,
            text,
            html
        } = job.data;

        await transporter.sendMail({
            from: process.env.MAIL_FROM,
            to,
            subject,
            text,
            html
        });
    },
    {
        connection,
        concurrency: 5
    }
);

emailWorker.on("completed", (job) => {
    console.log(`Email job ${job.id} completed`);
});

emailWorker.on("failed", (job, error) => {
    console.error(
        `Email job ${job?.id} failed:`,
        error.message
    );
});

module.exports = emailWorker;