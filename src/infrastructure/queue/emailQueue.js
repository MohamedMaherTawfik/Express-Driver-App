const { Queue } = require("bullmq");

const connection = require("./redisConnection");

const emailQueue = new Queue("email", {
    connection,

    defaultJobOptions: {
        attempts: 3,

        backoff: {
            type: "exponential",
            delay: 5000
        },

        removeOnComplete: {
            age: 60 * 60, // 1 hour
            count: 1000
        },

        removeOnFail: {
            age: 7 * 24 * 60 * 60, // 7 days
            count: 5000
        }
    }
});

module.exports = emailQueue;