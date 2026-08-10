const cron = require("node-cron");
const logger = require("../../../shared/config/logger");
const maintenanceQueue = require("../../queue/maintenanceQueue");

const startCleanupJob = () => {
    cron.schedule(
        "*/5 * * * *",
        async () => {
            try {
                const job = await maintenanceQueue.add(
                    "cleanup-expired-refresh-tokens",
                    {}
                );

                logger.info("Cleanup job queued", {
                    jobId: job.id,
                    jobName: job.name
                });
            } catch (error) {
                logger.error("Failed to queue cleanup job", {
                    message: error.message,
                    stack: error.stack
                });
            }
        },
        {
            timezone: process.env.APP_TIMEZONE || "Africa/Cairo"
        }
    );

    logger.info("Cleanup cron job registered");
};

module.exports = startCleanupJob;