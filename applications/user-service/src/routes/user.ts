import "dotenv/config"
import { Hono } from "hono";
import { db } from "../prisma/db"
import type {Variables} from "../types/types"

const user = new Hono<{ Variables: Variables }>();

user.get("/me", async(c) => {
    const payload = c.get("jwtPayload");
    const user_id = payload.user_id;

    const user = await db.orm.public.User
        .where({ id: user_id})
        .select("id", "name", "phone_number", "email")
        .first();
    
    return c.json({
        user
    })
})

user.get("/internal/users/:id", async(c) => {
    const user_id = await c.req.param("id");
    const user = await db.orm.public.User
        .where({ id: user_id })
        .select("id", "name", "phone_number", "email")
        .first();

    if (!user) {
        return c.json({
            "message": "User not found."
        }, 404);
    }

    return c.json({
        user
    })
})

export default user