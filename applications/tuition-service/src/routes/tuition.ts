import { Hono } from "hono";
import { db } from "../prisma/db";
import { jwt } from "hono/jwt";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { HTTPException } from "hono/http-exception";
import logger from "@soa/shared/log";

const tuition = new Hono();

tuition.use(
    "/*",
    jwt({
        secret: process.env["SECRET_KEY"]!,
        alg: "HS256",
    }),
);

tuition.onError((err, c) => {
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

const tuitionSchema = z.object({
    student_id: z.uuidv4(),
});

tuition.get(
    "/",
    zValidator("query", tuitionSchema, (result, c) => {
        if (!result.success) {
            return c.json(
                {
                    message: "Missing student_id.",
                },
                400,
            );
        }
    }),
    async (c) => {
        const { student_id }: { student_id: string } = c.req.valid("query");
        const student = await db.orm.public.Student.where({ id: student_id })
            .select("id", "name")
            .include("tuitions")
            .first();

        if (!student) {
            return c.json(
                {
                    message: "Student not found.",
                },
                404,
            );
        }

        return c.json(
            {
                student,
            },
            200,
        );
    },
);

const statusSchema = z.object({
    status: z.enum(["pending", "overdue", "paid"]),
});

const invoiceSchema = z.object({
    id: z.uuid(),
});

tuition.put(
    "/internal/:id/status",
    zValidator("json", statusSchema, (result, c) => {
        if (!result.success) {
            return c.json(
                {
                    message: "Invalid or missing status.",
                },
                400,
            );
        }
    }),
    zValidator("param", invoiceSchema, (result, c) => {
        if (!result.success) {
            return c.json(
                {
                    message: "Invalid invoice id.",
                },
                400,
            );
        }
    }),
    async (c) => {
        const { id } = c.req.valid("param");
        const { status } = c.req.valid("json");

        const updated = await db.orm.public.TuitionInvoice.where({ id }).update({ status });

        if (!updated) {
            return c.json(
                {
                    message: "Invoice not found.",
                },
                404,
            );
        }

        return c.body(null, 204);
    },
);

export default tuition;
