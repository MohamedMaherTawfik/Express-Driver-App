const getBearerToken = (req) => {
    const authorizationHeader = req.headers.authorization;

    if (!authorizationHeader?.startsWith("Bearer")) {
        return null;
    }

    return authorizationHeader.split(" ")[1];
};

module.exports = getBearerToken;
