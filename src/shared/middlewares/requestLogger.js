const morgan = require("morgan");
const logger = require("../config/logger");

const stream = {

    write(message) {

        logger.info("Incoming Request", {
            request: message.trim()
        });

    }

};

module.exports = morgan(

    ":method :url :status :response-time ms",

    {
        stream
    }

);