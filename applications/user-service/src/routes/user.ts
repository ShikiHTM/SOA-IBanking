import "dotenv/config";
import { Hono } from "hono";
import { jwt } from "hono/jwt";
import { db } from "../prisma/db";
import type { Variables } from "../types/types";
import { HTTPException } from "hono/http-exception";
import logger from "@soa/shared/log";

const user = new Hono<{ Variables: Variables }>();

user.use(
    "/*",
    jwt({
        secret: process.env["SECRET_KEY"]!,
        alg: "HS256",
    }),
);

user.onError((err, c) => {
    if (err instanceof HTTPException && err.status === 401) {
        return c.json({
            message: "Unauthorized, invalid or missing token",
        });
    }

    logger.error(err);
    return c.json(
        {
            message: "Internal Server Error",
        },
        500,
    );
});

user.get("/internal/me", async (c) => {
    const payload = c.get("jwtPayload");
    const user_id = payload.user_id;

    const user = await db.orm.public.User.where({ id: user_id }).select("id", "name", "phone_number", "email").first();

    return c.json(
        {
            user,
        },
        200,
    );
});

user.get("/internal/:id", async (c) => {
    const user_id = c.req.param("id");
    const user = await db.orm.public.User.where({ id: user_id }).select("id", "name", "phone_number", "email").first();

    if (!user) {
        return c.json(
            {
                message: "User not found.",
            },
            404,
        );
    }

    return c.json(
        {
            user,
        },
        200,
    );
});

export default user;
