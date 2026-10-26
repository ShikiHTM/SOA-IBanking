import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { db } from "../prisma/db";

const ledger = new Hono();

const ledgerQuerySchema = z.object({
    user_id: z.uuid(),
});

// GET /api/internal/ledger?user_id=...
ledger.get(
    "/",
    zValidator("query", ledgerQuerySchema, (result, c) => {
        if (!result.success) {
            return c.json(
                {
                    message: "Invalid or missing user_id.",
                },
                400,
            );
        }
    }),
    async (c) => {
        const { user_id } = c.req.valid("query");

        const userLedger = await db.orm.public.Ledger.where({ user_id })
            .include("transactions", (txs) => txs.orderBy((t) => t.created_at.desc()))
            .first();

        if (!userLedger) {
            const created = await db.orm.public.Ledger.create({ user_id, balance: 0 });
            return c.json(
                {
                    balance: created.balance,
                    transaction_history: [],
                },
                200,
            );
        }

        return c.json(
            {
                balance: userLedger.balance,
                transaction_history: userLedger.transactions,
            },
            200,
        );
    },
);

export default ledger;
