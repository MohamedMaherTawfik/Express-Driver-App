const startCleanupJob = require("./jobs/cleanupJob");
const logger = require("../../shared/config/logger");

const startScheduler = () => {
    startCleanupJob();

    logger.info("Scheduler started");
};

module.exports = startScheduler;