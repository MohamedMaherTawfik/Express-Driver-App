const { createLogger, format, transports } = require("winston");
const path = require("path");
const fs = require("fs");

const logDirectory = path.join(__dirname, "../../logs");

if (!fs.existsSync(logDirectory)) {
    fs.mkdirSync(logDirectory);
}

const logger = createLogger({

    level: process.env.LOG_LEVEL || "info",

    format: format.combine(
        format.timestamp({
            format: "YYYY-MM-DD HH:mm:ss"
        }),
        format.errors({
            stack: true
        }),
        format.json()
    ),

    defaultMeta: {
        service: "express-api"
    },

    transports: [

        new transports.File({
            filename: path.join(logDirectory, "error.log"),
            level: "error"
        }),

        new transports.File({
            filename: path.join(logDirectory, "combined.log")
        })

    ]

});

if (process.env.NODE_ENV !== "production") {

    logger.add(
        new transports.Console({
            format: format.combine(
                format.colorize(),
                format.simple()
            )
        })
    );

}

module.exports = logger;