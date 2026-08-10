const { Worker } = require("bullmq");

const connection = require("./redisConnection");
const refreshTokenRepository = require("../../modules/auth/repositories/refreshTokenRepository");
const logger = require("../../shared/config/logger");

const maintenanceWorker = new Worker(
    "maintenance",
    async (job) => {
        switch (job.name) {
            case "cleanup-expired-refresh-tokens": {
                const result =
                    await refreshTokenRepository.deleteExpired();

                logger.info("Expired refresh tokens cleaned", {
                    deletedCount: result.deletedCount
                });

                return {
                    deletedCount: result.deletedCount
                };
            }

            default:
                throw new Error(`Unknown maintenance job: ${job.name}`);
        }
    },
    {
        connection,
        concurrency: 1
    }
);

maintenanceWorker.on("completed", (job) => {
    logger.info("Maintenance job completed", {
        jobId: job.id,
        jobName: job.name
    });
});

maintenanceWorker.on("failed", (job, error) => {
    logger.error("Maintenance job failed", {
        jobId: job?.id,
        jobName: job?.name,
        message: error.message,
        stack: error.stack
    });
});

module.exports = maintenanceWorker;