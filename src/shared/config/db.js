const mongoose = require("mongoose");
const logger = require("./logger");

const connectDB = async () => {
    try {

        await mongoose.connect(process.env.MONGO_URI);

        logger.info("Database connected", {
            host: mongoose.connection.host,
            database: mongoose.connection.name
        });

    } catch (error) {

        logger.error("Database connection failed", {
            message: error.message,
            stack: error.stack
        });

        process.exit(1);
    }
};

module.exports = connectDB;