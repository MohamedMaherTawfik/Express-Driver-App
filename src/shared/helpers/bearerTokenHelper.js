const UnauthorizedError = require("../errors/UnauthorizedError");

const getBearerToken = (req) => {

    const authorization = req.headers.authorization;

    if (!authorization) {
        throw new UnauthorizedError("Authorization header is required");
    }

    const [scheme, token] = authorization.split(" ");

    if (scheme !== "Bearer" || !token) {
        throw new UnauthorizedError("Invalid authorization header");
    }

    return token;

};

module.exports = getBearerToken;