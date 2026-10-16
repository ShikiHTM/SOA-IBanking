import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { z } from "zod";
import { db } from "../prisma/db";

const student = new Hono();

const studentSchema = z.object({
    id: z.string().regex(/^[0-9A-H]\d{2}[0HK]\d{4}$/)
})

// GET /api/students/internal/:id
student.get("/internal/:id",
    zValidator("param", studentSchema, (result, c) => {
        if(!result.success) {
            return c.json({
                "message": "invalid student_id"
            }, 400)
        }
    }),
    async (c) => {
        const { id }: { id: string } = c.req.valid("param");

        const student = await db.orm.public.Student
            .where({id})
            .select("id", "name")
            .include("tuitions", (tuitions) => 
                tuitions.where({ status: "pending" })
            )
            .first();

        if(!student) {
            return c.json({
                "message": "Student not found."
            }, 404)
        }

        return c.json({
            student
        })
    }
)

export default student;