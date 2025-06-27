import { Redis } from "ioredis";
await import("dotenv/config");

const redis = new Redis({
    host: process.env.redis_host,
    port: Number(process.env.redis_port || 6379),
    password: process.env.redis_password || undefined,
    db: Number(process.env.redis_db || 0),
});
export default redis;
export const subscriber = redis;