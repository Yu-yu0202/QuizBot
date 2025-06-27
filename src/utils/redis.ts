import { Redis } from "ioredis";
await import("dotenv/config");

const redis = new Redis({
    host: process.env.REDIS_HOST,
    port: Number(process.env.REDIS_PORT),
    password: process.env.REDIS_PASSWORD || undefined,
    db: Number(process.env.REDIS_DB || 0),
});
export default redis;
export const subscriber = redis;