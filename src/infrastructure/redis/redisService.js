const redis = require("./redis");

class RedisService {

    async connect() {

        if (redis.status === "wait") {
            await redis.connect();
        }

    }

    async ping() {
        return await redis.ping();
    }

    async getOrSet(key, callback, ttl = 60) {
        const cachedData = await this.getJson(key);
        console.log("CACHE KEY:", key);
        console.log("CACHE HIT:", cachedData !== null);
        if (cachedData !== null) {
            return {
                data: cachedData,
                cached: true
            };
        }
        const data = await callback();
        await this.setJson(key, data, ttl);
        return {
            data,
            cached: false
        };
    }

    async get(key) {
        return await redis.get(key);
    }

    async set(key, value, ttl = null) {

        if (ttl) {

            return await redis.set(
                key,
                value,
                "EX",
                ttl
            );

        }

        return await redis.set(key, value);

    }

    async setJson(key, value, ttl = null) {

        return await this.set(
            key,
            JSON.stringify(value),
            ttl
        );

    }

    async getJson(key) {

        const value = await this.get(key);

        if (!value) {
            return null;
        }

        return JSON.parse(value);

    }

    async delete(key) {
        return await redis.del(key);
    }

    async deleteByPrefix(prefix) {

        let cursor = "0";

        do {

            const [nextCursor, keys] = await redis.scan(
                cursor,
                "MATCH",
                `${prefix}:*`,
                "COUNT",
                100
            );

            cursor = nextCursor;

            if (keys.length > 0) {
                await redis.del(...keys);
            }

        } while (cursor !== "0");

    }

    async exists(key) {
        return await redis.exists(key);
    }

    async expire(key, seconds) {
        return await redis.expire(
            key,
            seconds
        );
    }

    async disconnect() {

        if (
            redis.status !== "end" &&
            redis.status !== "wait"
        ) {
            await redis.quit();
        }

    }

}

module.exports = new RedisService();