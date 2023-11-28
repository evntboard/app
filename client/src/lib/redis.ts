import Redis from "ioredis";
import process from "node:process";

declare global {
    // eslint-disable-next-line no-var
    var cachedRedis: Redis
}

let redisClient: Redis

export const redisConfig = process.env['REDIS_URL'] ?? ''

if (process.env.NODE_ENV === "production") {
    redisClient = new Redis(redisConfig)
} else {
    if (!global.cachedRedis) {
        global.cachedRedis = new Redis(redisConfig)
    }
    redisClient = global.cachedRedis
}


export const redis = redisClient