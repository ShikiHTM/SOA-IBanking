import { Hono } from "hono";
import { db } from "../prisma/db";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import logger from "@soa/shared/log";

const tuition = new Hono();

const tuitionSchema = z.object({
    student_id: z.uuidv4(),
    amount: z.float64().default(0),
});

tuition.get(
    "/",
    zValidator("json", tuitionSchema, (result, c) => {
        if (!result.success) {
            return c.json(
                {
                    message: "Missing or invalid fields.",
                },
                400,
            );
        }
    }),
    async (c) => {
        const { student_id } = c.req.valid("json");
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

// POST /api/tuitions/internal
tuition.post("/internal", 
    zValidator("json", tuitionSchema, (result, c) => {
        if (!result.success) {
            return c.json(
                {
                    message: "Missing or invalid fields.",
                },
                400,
            );
        }
    })
    ,
    async (c) => {
        const { student_id, amount } = c.req.valid("json");

        const student = await db.orm.public.Student.where({ id: student_id })
            .select("id", "name")
            .first();

        if(!student) {
            return c.json(
                {
                    message: "Student not found.",
                },
                404,
            );
        }

        try {
            const new_tuition = await db.orm.public.TuitionInvoice.create({
                amount,
                student_id
            })

            return c.json({
                new_tuition
            })
        }catch(error) {
            logger.error(error);
            return c.json({
                "message": "Can't create new tuition."
            }, 500)
        }
    }
)

export default tuition;