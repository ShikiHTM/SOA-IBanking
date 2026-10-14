import "dotenv/config";
import { Hono } from "hono";
import { db } from "../prisma/db";
import type { PaymentLedgerResponse, Variables } from "../types/types";
import got from "got";

const user = new Hono<{ Variables: Variables }>();

// GET /api/users/internal/me
user.get("/internal/me", async (c) => {
    const user_id = c.req.header("X-User-Id");

    const user = await db.orm.public.User.where({ id: user_id }).select("id", "name", "phone_number", "email", "username").first();

    return c.json(
        {
            user,
        },
        200,
    );
});

// GET /api/users/internal/:id
user.get("/internal/:id", async (c) => {
    const user_id = c.req.param("id");
    const user = await db.orm.public.User.where({ id: user_id }).select("id", "name", "phone_number", "email", "username").first();

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

// GET /api/users/interal/:id/ledger
user.get("/internal/:id/ledger", async (c) => {
    const user_id = c.req.param("id");   
    const caller_id = c.req.header("X-User-Id");

    if(caller_id !== user_id) {
        return c.json({
            "message": "Unauthorized, you are not allowed to do this action",
        }, 403);
    }

    const ledger = await got.get(`${process.env["PAYMENT_SERVICE_URL"]}/api/internal/ledger?user_id=${user_id}`).json<PaymentLedgerResponse>();

    return c.json({ledger});
});

export default user;
