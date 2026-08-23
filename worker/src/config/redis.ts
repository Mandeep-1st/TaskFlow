import { Redis } from "ioredis";
import dotenv from 'dotenv'
dotenv.config();
const redisUrl = process.env.REDIS_URL;
if (!redisUrl) {
    throw new Error("REDIS_URL is not set");
}

export const redisConnection = new Redis(redisUrl, {
    maxRetriesPerRequest: null,
});
