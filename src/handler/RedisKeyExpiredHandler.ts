import { Redis } from "ioredis";
import { handleQuizExpired } from "../commands/CreateQuiz.js";
import { Client } from "discord.js";

export async function startRedisKeyExpiredHandler(client: Client) {
    const subscriber = new Redis();

    try {
        await subscriber.psubscribe("__keyevent@0__:expired");

        subscriber.on("pmessage", async (_pattern: any, _channel: any, key: string) => {
            try {
                if (key.startsWith("quiz:")) {
                    await handleQuizExpired(key, client);
                }
            } catch (error) {
                console.error('[Redis] Error handling expired key:', error);
            }
        });

        subscriber.on("error", (error: any) => {
            console.error("[Redis] Subscriber error:", error);
        });

    } catch (error) {
        console.error("[Redis] Connection error:", error);
        throw error;
    }
}