const { Queue } = require("bullmq");

const connection = require("./redisConnection");

const maintenanceQueue = new Queue("maintenance", {
    connection,

    defaultJobOptions: {
        attempts: 3,

        backoff: {
            type: "exponential",
            delay: 5000
        },

        removeOnComplete: {
            age: 60 * 60,
            count: 1000
        },

        removeOnFail: {
            age: 7 * 24 * 60 * 60,
            count: 5000
        }
    }
});

module.exports = maintenanceQueue;