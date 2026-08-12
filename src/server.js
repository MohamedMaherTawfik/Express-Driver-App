require("dotenv-safe").config();

const http = require("http");
const mongoose = require("mongoose");

const app = require("./app");

const connectDB = require("./shared/config/db");
const redisService = require("./infrastructure/redis/redisService");
const logger = require("./shared/config/logger");

const emailWorker = require("./infrastructure/queue/emailWorker");
const maintenanceWorker = require("./infrastructure/queue/maintenanceWorker");

const startScheduler = require("./infrastructure/scheduler/scheduler");

const {
    initializeSocket
} = require("./infrastructure/socket/socketServer");

const PORT = process.env.PORT || 3000;

let server;

const startServer = async () => {
    try {
        /*
        |--------------------------------------------------------------------------
        | Database
        |--------------------------------------------------------------------------
        */

        await connectDB();

        /*
        |--------------------------------------------------------------------------
        | Mail
        |--------------------------------------------------------------------------
        */

        const mail = require("./infrastructure/email/mail");

        await mail.verify();

        logger.info("Mail server connected");

        /*
        |--------------------------------------------------------------------------
        | Redis
        |--------------------------------------------------------------------------
        */

        await redisService.connect();

        /*
        |--------------------------------------------------------------------------
        | HTTP Server
        |--------------------------------------------------------------------------
        */

        const httpServer = http.createServer(app);

        /*
        |--------------------------------------------------------------------------
        | Socket.IO
        |--------------------------------------------------------------------------
        */

        initializeSocket(httpServer);

        /*
        |--------------------------------------------------------------------------
        | Start Server
        |--------------------------------------------------------------------------
        */

        server = httpServer.listen(PORT, () => {
            logger.info(
                `🚀 Server running on http://localhost:${PORT}`
            );

            startScheduler();
        });

    } catch (error) {
        logger.error("Failed to start server", {
            message: error.message,
            stack: error.stack
        });

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
    logger.warn(
        `${signal} received. Shutting down server...`
    );

    try {
        /*
        |--------------------------------------------------------------------------
        | HTTP Server
        |--------------------------------------------------------------------------
        */

        if (server) {
            await new Promise((resolve) => {
                server.close(resolve);
            });
        }

        /*
        |--------------------------------------------------------------------------
        | Workers
        |--------------------------------------------------------------------------
        */

        await emailWorker.close();
        await maintenanceWorker.close();

        /*
        |--------------------------------------------------------------------------
        | Redis
        |--------------------------------------------------------------------------
        */

        await redisService.disconnect();

        /*
        |--------------------------------------------------------------------------
        | MongoDB
        |--------------------------------------------------------------------------
        */

        await mongoose.connection.close();

        logger.info("MongoDB connection closed.");
        logger.info("Server shutdown completed.");

        process.exit(0);

    } catch (error) {
        logger.error("Error during shutdown", {
            message: error.message,
            stack: error.stack
        });

        process.exit(1);
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
    logger.error("Unhandled Promise Rejection", {
        message: error.message,
        stack: error.stack
    });
});

process.on("uncaughtException", (error) => {
    logger.error("Uncaught Exception", {
        message: error.message,
        stack: error.stack
    });

    process.exit(1);
});