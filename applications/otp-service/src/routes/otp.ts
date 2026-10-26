import { randomInt } from "node:crypto";
import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import logger from "@soa/shared/log";
import { redis } from "../redis";
import { EMAIL_QUEUE_KEY } from "../mailer";

const otp = new Hono();

const OTP_TTL_SECONDS = 300;

const generateOtpSchema = z.object({
    transaction_id: z.uuid(),
    email: z.email(),
});

const verifyOtpSchema = z.object({
    transaction_id: z.uuid(),
    otp: z.string().regex(/^\d{6}$/),
});

// Atomically verify both directions (transaction_id <-> otp) and consume the OTP in a single step
const VERIFY_AND_DELETE_SCRIPT = `
local savedOtp = redis.call("GET", KEYS[1])
local savedTx = redis.call("GET", KEYS[2])
if savedOtp == ARGV[1] and savedTx == ARGV[2] then
    redis.call("DEL", KEYS[1], KEYS[2])
    return 1
end
return 0
`;

// POST /api/otp/internal
otp.post(
    "/internal",
    zValidator("json", generateOtpSchema, (result, c) => {
        if (!result.success) {
            return c.json(
                {
                    message: "Invalid or missing fields.",
                },
                400,
            );
        }
    }),
    async (c) => {
        const { transaction_id, email } = c.req.valid("json");
        const txKey = `otp:tx:${transaction_id}`;

        try {
            // Revoke previous OTP if this transaction already has one to maintain 1-to-1 mapping
            const existingCode = await redis.get(txKey);
            if (existingCode) {
                await redis.del(`otp:code:${existingCode}`, txKey);
            }

            // Generate a 6-digit code that is not currently bound to any other active transaction
            let code = "";
            do {
                code = randomInt(100000, 1000000).toString();
            } while ((await redis.exists(`otp:code:${code}`)) === 1);

            const codeKey = `otp:code:${code}`;
            const emailJob = JSON.stringify({
                to: email,
                otp: code,
                transactionId: transaction_id,
                attempts: 0,
            });

            // Save 1-to-1 OTP mappings and push the email job into the work queue atomically
            await redis
                .multi()
                .set(txKey, code, "EX", OTP_TTL_SECONDS)
                .set(codeKey, transaction_id, "EX", OTP_TTL_SECONDS)
                .lpush(EMAIL_QUEUE_KEY, emailJob)
                .exec();

            logger.info(`Generated OTP ${code} and queued email to ${email} for transaction ${transaction_id}`);

            return c.json(
                {
                    transaction_id,
                    expires_in: OTP_TTL_SECONDS,
                },
                201,
            );
        } catch (error) {
            logger.error(error);
            return c.json(
                {
                    message: "Failed to generate OTP.",
                },
                500,
            );
        }
    },
);

// POST /api/otp/internal/verify
otp.post(
    "/internal/verify",
    zValidator("json", verifyOtpSchema, (result, c) => {
        if (!result.success) {
            return c.json(
                {
                    message: "Invalid or expired OTP.",
                },
                400,
            );
        }
    }),
    async (c) => {
        const { transaction_id, otp: code } = c.req.valid("json");
        const txKey = `otp:tx:${transaction_id}`;
        const codeKey = `otp:code:${code}`;

        try {
            const matched = await redis.eval(VERIFY_AND_DELETE_SCRIPT, 2, txKey, codeKey, code, transaction_id);

            if (matched !== 1) {
                return c.json(
                    {
                        message: "Invalid or expired OTP.",
                    },
                    400,
                );
            }

            return c.json(
                {
                    message: "OTP verified successfully.",
                },
                200,
            );
        } catch (error) {
            logger.error(error);
            return c.json(
                {
                    message: "Failed to verify OTP.",
                },
                500,
            );
        }
    },
);

export default otp;
