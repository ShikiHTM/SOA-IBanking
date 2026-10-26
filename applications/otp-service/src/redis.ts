import "dotenv/config";
import { Redis } from "ioredis";
import logger from "@soa/shared/log";

export const redis = new Redis(process.env["REDIS_URL"] ?? "redis://localhost:6379");

redis.on("error", (err) => {
    logger.error("Redis connection error:", err);
});
