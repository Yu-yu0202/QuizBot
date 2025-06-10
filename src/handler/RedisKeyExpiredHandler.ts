import { createClient } from "redis";
import { handleQuizExpired } from "../commands/CreateQuiz";
import { Client } from "discord.js";
import { Redis } from "ioredis";

const redis = new Redis();

export async function startRedisKeyExpiredHandler(client: Client) {
    const subscriber = createClient();
    try {
        await subscriber.connect();
        await subscriber.subscribe("__keyevent@0__:expired", async (key) => {
            try {
                if (key.startsWith("quiz:") && !key.includes(":")) {
                    await handleQuizExpired(key, client);
                    await redis.del(key);
                }
            } catch (error) {
                console.error('クイズ終了処理エラー:', error);
            }
        });
        subscriber.on('error', (error) => {
            console.error('Redis subscriber error:', error);
        });
    } catch (error) {
        console.error('Redis接続エラー:', error);
        throw error;
    }
}