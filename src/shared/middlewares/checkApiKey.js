const UnauthorizedError = require("../errors/UnauthorizedError");

const checkApiKey = (req, res, next) => {
    const apiKey = req.headers["x-api-key"];

    if (!apiKey) {
        throw new UnauthorizedError("API Key is required");
    }

    if (apiKey !== process.env.API_KEY) {
        throw new UnauthorizedError("Invalid API Key");
    }

    next();
};

module.exports = checkApiKey;
