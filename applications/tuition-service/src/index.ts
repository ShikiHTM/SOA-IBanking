import "dotenv/config";
import { Hono } from "hono";
import { logger } from "hono/logger";
import Logger from "@soa/shared/log";
import { cors } from "hono/cors";
import { serve } from "@hono/node-server";

const app = new Hono();

app.use(
    "*",
    logger((message, ...rest) => {
        Logger.info(message, rest);
    }),
);

app.use(
    "/api/*",
    cors({
        origin: ["http://localhost:3000"],
        allowMethods: ["GET", "POST", "PUT"],
        maxAge: 600,
    }),
);

serve(
    {
        fetch: app.fetch,
        port: Number(process.env["PORT"]),
    },
    (info) => {
        Logger.info(`User Service is running on http://localhost:${info.port}`);
    },
);
