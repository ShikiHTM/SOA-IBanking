import { Hono } from "hono";

const tuition = new Hono();

tuition.get("/", async (c) => {});

export default tuition;
