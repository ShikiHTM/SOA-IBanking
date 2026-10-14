import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { db } from "../prisma/db";
import { sign } from "hono/jwt";
import { createHash } from "node:crypto";
import { z } from "zod";

const auth = new Hono();

const loginSchema = z.object({
    username: z.string().min(1),
    password: z.string().min(1),
});

auth.post(
    "/auth/login",
    zValidator("json", loginSchema, (result, c) => {
        if (!result.success) {
            return c.json(
                {
                    message: "Invalid request format or missing fields.",
                    errors: result.error.issues,
                },
                400,
            );
        }
    }),
    async (c) => {
        const { username, password }: { username: string; password: string } = await c.req.json();

        const user = await db.orm.public.User.where({ username }).select("id", "username", "password").first();

        if (!user) {
            return c.json(
                {
                    message: "Incorrect username or password.",
                },
                401,
            );
        }

        const hashed_password = createHash("sha256").update(password).digest("base64");

        if (hashed_password !== user.password) {
            return c.json(
                {
                    message: "Incorrect username or password.",
                },
                401,
            );
        }

        const payload = {
            user_id: user.id,
            exp: Math.floor(Date.now() / 1000) + 60 * 30, // Expired in 30 minutes
        };

        const token = await sign(payload, process.env["SECRET_KEY"]!);

        return c.json({
            access_token: token,
            token_type: "Bearer",
            message: "Login successfully.",
        });
    },
);

export default auth;
