const crypto = require("crypto");

const buildCacheKey = (prefix, data) => {
    const normalizedData = JSON.stringify(data);
    const hash = crypto
        .createHash("sha256")
        .update(normalizedData)
        .digest("hex");
    return `${prefix}:${hash}`;
};

module.exports = {
    buildCacheKey
};