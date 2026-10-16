import "dotenv/config";
import { Hono } from "hono";
import { logger } from "hono/logger";
import Logger from "@soa/shared/log";
import { cors } from "hono/cors";
import { serve } from "@hono/node-server";
import tuition from "./routes/tuition";
import student from "./routes/student";

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

app.use(
    "*",
    async(c, next) => {
        const header = c.req.header("X-User-Id")
        
        if(!header) {
            return c.json({
                "message": "Unauthorized, invalid or missing token.",
            }, 401)
        }

        await next();
    }
)

app.route("/api/tuitions", tuition);
app.route("/api/students", student);

serve(
    {
        fetch: app.fetch,
        port: Number(process.env["PORT"]),
    },
    (info) => {
        Logger.info(`Tuition Service is running on http://localhost:${info.port}`);
    },
);
