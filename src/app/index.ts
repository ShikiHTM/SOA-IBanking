import { Hono } from "hono";
import { cors } from "hono/cors";
import appConfig from "@/configs/app.config";

const app = new Hono();

app.use(
    "/api/*",
    cors({
        origin: ["https://localhost"],
    }),
);
