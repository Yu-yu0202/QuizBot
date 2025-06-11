import Redis from "ioredis";
import { handleQuizExpired } from "../commands/CreateQuiz";
import { Client } from "discord.js";

const redis = new Redis();

export async function startRedisKeyExpiredHandler(client: Client) {
    const subscriber = new Redis({
        host: process.env.REDIS_HOST || "localhost",
        port: parseInt(process.env.REDIS_PORT || "6379", 10),
    });
    subscriber.on("connect", () => {
        console.log("[Redis] Subscriber connected successfully.");
    });
    try {
        await subscriber.psubscribe("__keyevent@0__:expired");

        subscriber.on("pmessage", async (_pattern, _channel, key) => {
            try {
                if (key.startsWith("quiz:") && key.split(":").length === 3) {
                    console.log(`[Redis] Key expired: ${key}`);
                    await handleQuizExpired(key, client);
                    await redis.del(key);
                }
            } catch (error) {
                console.error('[Redis] Error handling expired key:', error);
            }
        });

        subscriber.on("error", (error) => {
            console.error("[Redis] Subscriber error:", error);
        });

    } catch (error) {
        console.error("[Redis] Connection error:", error);
        throw error;
    }
}