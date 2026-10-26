import "dotenv/config";
import { Hono, type Context } from "hono";
import { logger } from "hono/logger";
import { cors } from "hono/cors";
import { jwt } from "hono/jwt";
import { HTTPException } from "hono/http-exception";
import type { ContentfulStatusCode } from "hono/utils/http-status";
import { serve } from "@hono/node-server";
import got, { HTTPError } from "got";
import Logger from "@soa/shared/log";
import type { Variables } from "./types/types";

const app = new Hono<{ Variables: Variables }>();

app.use(
    "*",
    logger((message, ...rest) => {
        Logger.info(message, rest);
    }),
);

app.use(
    "*",
    cors({
        origin: ["http://localhost:3000"],
        allowMethods: ["GET", "POST", "PUT"],
        maxAge: 600,
    }),
);

app.onError((err, c) => {
    if (err instanceof HTTPException && err.status === 401) {
        return c.json(
            {
                message: "Unauthorized, invalid or missing token.",
            },
            401,
        );
    }

    Logger.error(err);
    return c.json(
        {
            message: "Internal Server Error.",
        },
        500,
    );
});

function handleDownstreamError(error: unknown, c: Context) {
    if (error instanceof HTTPError) {
        const status = error.response.statusCode as ContentfulStatusCode;
        try {
            const body = JSON.parse(String(error.response.body)) as Record<string, unknown>;
            return c.json(body, status);
        } catch {
            return c.json({ message: error.message }, status);
        }
    }

    Logger.error(error);
    return c.json(
        {
            message: "Service is not available, try again later.",
        },
        503,
    );
}

// POST /auth/login
app.post("/auth/login", async (c) => {
    try {
        const body = await c.req.json<Record<string, unknown>>();
        const response = await got
            .post(`${process.env["USER_SERVICE_URL"]}/api/auth/login`, {
                json: body,
                timeout: { request: 3000 },
            })
            .json<Record<string, unknown>>();

        return c.json(response, 200);
    } catch (error) {
        return handleDownstreamError(error, c);
    }
});

// Verify JWT for all protected endpoints
app.use(
    "*",
    jwt({
        secret: process.env["SECRET_KEY"]!,
        alg: "HS256",
    }),
);

// GET /users/me
app.get("/users/me", async (c) => {
    const { user_id } = c.get("jwtPayload");

    try {
        const response = await got
            .get(`${process.env["USER_SERVICE_URL"]}/api/users/internal/me`, {
                headers: { "X-User-Id": user_id },
                timeout: { request: 3000 },
            })
            .json<Record<string, unknown>>();

        return c.json(response, 200);
    } catch (error) {
        return handleDownstreamError(error, c);
    }
});

// GET /users/:id/ledger
app.get("/users/:id/ledger", async (c) => {
    const { user_id } = c.get("jwtPayload");
    const id = c.req.param("id");

    try {
        const response = await got
            .get(`${process.env["USER_SERVICE_URL"]}/api/users/internal/${id}/ledger`, {
                headers: { "X-User-Id": user_id },
                timeout: { request: 3000 },
            })
            .json<Record<string, unknown>>();

        return c.json(response, 200);
    } catch (error) {
        return handleDownstreamError(error, c);
    }
});

// GET /tuitions?student_id={id}
app.get("/tuitions", async (c) => {
    const { user_id } = c.get("jwtPayload");
    const student_id = c.req.query("student_id");

    if (!student_id) {
        return c.json(
            {
                message: "Missing student_id.",
            },
            400,
        );
    }

    try {
        const response = await got
            .get(`${process.env["TUITION_SERVICE_URL"]}/api/students/internal/${student_id}`, {
                headers: { "X-User-Id": user_id },
                timeout: { request: 3000 },
            })
            .json<Record<string, unknown>>();

        return c.json(response, 200);
    } catch (error) {
        return handleDownstreamError(error, c);
    }
});

// POST /payment
app.post("/payment", async (c) => {
    const { user_id } = c.get("jwtPayload");

    try {
        const body = await c.req.json<Record<string, unknown>>();
        const response = await got
            .post(`${process.env["PAYMENT_SERVICE_URL"]}/api/payment/internal`, {
                headers: { "X-User-Id": user_id },
                json: body,
                timeout: { request: 5000 },
            })
            .json<Record<string, unknown>>();

        return c.json(response, 201);
    } catch (error) {
        return handleDownstreamError(error, c);
    }
});

// POST /payment/:id/verify
app.post("/payment/:id/verify", async (c) => {
    const { user_id } = c.get("jwtPayload");
    const id = c.req.param("id");

    try {
        const body = await c.req.json<Record<string, unknown>>();
        const response = await got
            .post(`${process.env["PAYMENT_SERVICE_URL"]}/api/payment/internal/${id}/verify`, {
                headers: { "X-User-Id": user_id },
                json: body,
                timeout: { request: 5000 },
            })
            .json<Record<string, unknown>>();

        return c.json(response, 200);
    } catch (error) {
        return handleDownstreamError(error, c);
    }
});

serve(
    {
        fetch: app.fetch,
        port: Number(process.env["PORT"]),
    },
    (info) => {
        Logger.info(`Gateway Service is running on http://localhost:${info.port}`);
    },
);
