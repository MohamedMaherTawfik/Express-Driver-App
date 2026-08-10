require("dotenv-safe").config();
const app = require("./app");
const connectDB = require("./shared/config/db");
const redisService = require("./infrastructure/redis/redisService");
const logger = require("./shared/config/logger");
const mongoose = require("mongoose");
const PORT = process.env.PORT || 3000;
let server;
const startServer = async () => {
    try {
        await connectDB();
        const mail = require("./infrastructure/email/mail");
        await mail.verify();
        logger.info("Mail server connected");
        await redisService.connect();
        server = app.listen(PORT, () => {
            logger.info(
                `🚀 Server running on http://localhost:${PORT}`
            );
        });
    } catch (error) {
        logger.error("Failed to start server");
        logger.error(error);
        process.exit(1);
    }
};
startServer();
/*
|--------------------------------------------------------------------------
| Graceful Shutdown
|--------------------------------------------------------------------------
*/

const shutdown = async (signal) => {
    logger.warn(`${signal} received. Shutting down server...`);
    if (server) {
        server.close(async () => {
            await redisService.disconnect();
            await mongoose.connection.close();
            logger.info("MongoDB connection closed.");
            process.exit(0);
        });
    } else {
        process.exit(0);
    }
};
process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

/*
|--------------------------------------------------------------------------
| Global Process Handlers
|--------------------------------------------------------------------------
*/

process.on("unhandledRejection", (error) => {
    logger.error("Unhandled Promise Rejection");
    logger.error(error);
});
process.on("uncaughtException", (error) => {
    logger.error("Uncaught Exception");
    logger.error(error);
    process.exit(1);
});