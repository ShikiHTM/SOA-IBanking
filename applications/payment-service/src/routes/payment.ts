import { Hono } from "hono";

const payment = new  Hono();

payment.get("/")