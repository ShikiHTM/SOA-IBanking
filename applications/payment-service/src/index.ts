import "dotenv/config"
import Logger from "@soa/shared/log";
import { Hono } from "hono"
import { logger } from "hono/logger";
import { cors } from "hono/cors";
import { serve } from "@hono/node-server";

const app = new Hono();

app.use(
    "*",
    logger((message, ...rest) => {
        Logger.info(message, rest);
    })
)

app.use(
    "/api/*",
    cors({
        origin: ["http://localhost:3000"],
        allowMethods: ["GET", "POST", "PUT"],
        maxAge: 600,
    })
)

app.use(
    "*",
    async(c, next) => {
        const header = c.req.header("X-JWT-Token")
        
        if(!header) {
            return c.json({
                "message": "Unauthorized, invalid or missing token.",
            }, 401)
        }

        await next();
    }
)

serve(
    {
        fetch: app.fetch,
        port: Number(process.env["PORT"])
    },
    (info) => {
        Logger.info(`Payment Service is running on http://localhost:${info.port}`);
    }
)
