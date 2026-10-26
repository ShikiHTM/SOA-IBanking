import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import got, { HTTPError } from "got";
import logger from "@soa/shared/log";
import { db } from "../prisma/db";
import type { GenerateOtpResponse, TuitionInvoiceResponse, UserInfoResponse } from "../types/types";

const payment = new Hono();

const createPaymentSchema = z.object({
    tuition_id: z.uuid(),
    amount: z.float64().positive(),
});

const verifyParamSchema = z.object({
    id: z.uuid(),
});

const verifyBodySchema = z.object({
    otp: z.string().regex(/^\d{6}$/),
});

// POST /api/payment/internal
payment.post(
    "/internal",
    zValidator("json", createPaymentSchema, (result, c) => {
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
        const user_id = c.req.header("X-User-Id")!;
        const { tuition_id, amount } = c.req.valid("json");

        let userEmail: string;
        try {
            const [{ tuition }, { user }] = await Promise.all([
                got
                    .get(`${process.env["TUITION_SERVICE_URL"]}/api/tuitions/internal/${tuition_id}`, {
                        headers: { "X-User-Id": user_id },
                        timeout: { request: 3000 },
                    })
                    .json<TuitionInvoiceResponse>(),
                got
                    .get(`${process.env["USER_SERVICE_URL"]}/api/users/internal/${user_id}`, {
                        headers: { "X-User-Id": user_id },
                        timeout: { request: 3000 },
                    })
                    .json<UserInfoResponse>(),
            ]);

            if (tuition.status === "paid") {
                return c.json(
                    {
                        message: "Tuition invoice has already been paid.",
                    },
                    400,
                );
            }

            if (tuition.amount !== amount) {
                return c.json(
                    {
                        message: "Invalid payment amount.",
                    },
                    400,
                );
            }

            userEmail = user.email;
        } catch (error) {
            if (error instanceof HTTPError && error.response.statusCode === 404) {
                return c.json(
                    {
                        message: "Tuition invoice not found.",
                    },
                    404,
                );
            }

            logger.error(error);
            return c.json(
                {
                    message: "Service is not available, try again later.",
                },
                503,
            );
        }

        const txResult = await db.transaction(async (tx) => {
            // Lock all transactions for this tuition_id to prevent creating a new transaction once completed
            const existingTxs = await tx.orm.public.PaymentTransaction.where({ tuition_id })
                .orderBy((t) => t.id.asc())
                .forUpdate()
                .all();

            if (existingTxs.some((t) => t.status === "completed")) {
                return {
                    ok: false as const,
                    status: 400 as const,
                    message: "Tuition invoice has already been paid.",
                };
            }

            const ledger = await tx.orm.public.Ledger.where({ user_id }).forUpdate().first();
            if (!ledger || ledger.balance < amount) {
                return {
                    ok: false as const,
                    status: 400 as const,
                    message: "Insufficent balance.",
                };
            }

            const created = await tx.orm.public.PaymentTransaction.create({
                ledger_id: ledger.id,
                tuition_id,
                amount,
                status: "pending",
            });

            return {
                ok: true as const,
                transaction: created,
            };
        });

        if (!txResult.ok) {
            return c.json(
                {
                    message: txResult.message,
                },
                txResult.status,
            );
        }

        try {
            await got
                .post(`${process.env["OTP_SERVICE_URL"]}/api/otp/internal`, {
                    json: {
                        transaction_id: txResult.transaction.id,
                        email: userEmail,
                    },
                    timeout: { request: 5000 },
                })
                .json<GenerateOtpResponse>();
        } catch (error) {
            logger.error(error);
            await db.orm.public.PaymentTransaction.where({ id: txResult.transaction.id }).update({ status: "failed" });
            return c.json(
                {
                    message: "Service is not available, try again later.",
                },
                503,
            );
        }

        return c.json(
            {
                transaction_id: txResult.transaction.id,
                status: "PENDING",
                message: "Transaction created successfully.",
            },
            201,
        );
    },
);

// POST /api/payment/internal/:id/verify
payment.post(
    "/internal/:id/verify",
    zValidator("param", verifyParamSchema, (result, c) => {
        if (!result.success) {
            return c.json(
                {
                    message: "Transaction not found.",
                },
                404,
            );
        }
    }),
    zValidator("json", verifyBodySchema, (result, c) => {
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
        const user_id = c.req.header("X-User-Id")!;
        const { id } = c.req.valid("param");
        const { otp } = c.req.valid("json");

        const transaction = await db.orm.public.PaymentTransaction.where({ id }).include("ledger").first();
        if (!transaction) {
            return c.json(
                {
                    message: "Transaction not found.",
                },
                404,
            );
        }

        if (transaction.ledger.user_id !== user_id) {
            return c.json(
                {
                    message: "You do not have permission to verify this transaction.",
                },
                403,
            );
        }

        if (transaction.status !== "pending") {
            return c.json(
                {
                    message: "Transaction has already been processed.",
                },
                400,
            );
        }

        try {
            await got.post(`${process.env["OTP_SERVICE_URL"]}/api/otp/internal/verify`, {
                json: { transaction_id: id, otp },
                timeout: { request: 3000 },
            });
        } catch (error) {
            if (error instanceof HTTPError && error.response.statusCode === 400) {
                return c.json(
                    {
                        message: "Invalid or expired OTP.",
                    },
                    400,
                );
            }

            logger.error(error);
            return c.json(
                {
                    message: "Service is not available, try again later.",
                },
                503,
            );
        }

        try {
            const verifyResult = await db.transaction(async (tx) => {
                // Lock all transactions for the same tuition_id in ascending id order to prevent:
                // 1) Two users paying the same tuition concurrently
                // 2) The same tuition being paid twice
                const tuitionTransactions = await tx.orm.public.PaymentTransaction.where({
                    tuition_id: transaction.tuition_id,
                })
                    .orderBy((t) => t.id.asc())
                    .forUpdate()
                    .all();

                const currentTx = tuitionTransactions.find((t) => t.id === id);
                if (!currentTx || currentTx.status !== "pending") {
                    return {
                        ok: false as const,
                        status: 400 as const,
                        message: "Transaction has already been processed.",
                    };
                }

                if (tuitionTransactions.some((t) => t.status === "completed")) {
                    await tx.orm.public.PaymentTransaction.where({ id }).update({ status: "rejected" });
                    return {
                        ok: false as const,
                        status: 400 as const,
                        message: "Tuition invoice has already been paid.",
                    };
                }

                const { tuition } = await got
                    .get(`${process.env["TUITION_SERVICE_URL"]}/api/tuitions/internal/${transaction.tuition_id}`, {
                        headers: { "X-User-Id": user_id },
                        timeout: { request: 3000 },
                    })
                    .json<TuitionInvoiceResponse>();

                if (tuition.status === "paid") {
                    await tx.orm.public.PaymentTransaction.where({ id }).update({ status: "rejected" });
                    return {
                        ok: false as const,
                        status: 400 as const,
                        message: "Tuition invoice has already been paid.",
                    };
                }

                // Lock user's ledger row to prevent concurrent balance deductions
                const ledger = await tx.orm.public.Ledger.where({ id: transaction.ledger_id }).forUpdate().first();
                if (!ledger || ledger.balance < transaction.amount) {
                    await tx.orm.public.PaymentTransaction.where({ id }).update({ status: "failed" });
                    return {
                        ok: false as const,
                        status: 400 as const,
                        message: "Insufficent balance.",
                    };
                }

                await tx.orm.public.Ledger.where({ id: ledger.id }).update({
                    balance: ledger.balance - transaction.amount,
                });

                await tx.orm.public.PaymentTransaction.where({ id }).update({
                    status: "completed",
                });

                // Reject all other pending transactions targeting the same tuition_id
                for (const otherTx of tuitionTransactions) {
                    if (otherTx.id !== id && otherTx.status === "pending") {
                        await tx.orm.public.PaymentTransaction.where({ id: otherTx.id }).update({
                            status: "rejected",
                        });
                    }
                }

                await got.put(
                    `${process.env["TUITION_SERVICE_URL"]}/api/tuitions/internal/${transaction.tuition_id}/status`,
                    {
                        headers: { "X-User-Id": user_id },
                        json: { status: "paid" },
                        timeout: { request: 3000 },
                    },
                );

                return {
                    ok: true as const,
                };
            });

            if (!verifyResult.ok) {
                return c.json(
                    {
                        message: verifyResult.message,
                    },
                    verifyResult.status,
                );
            }

            return c.json(
                {
                    transaction_id: id,
                    status: "COMPLETED",
                    message: "Payment verified and completed.",
                },
                200,
            );
        } catch (error) {
            logger.error(error);
            return c.json(
                {
                    message: "Service is not available, try again later.",
                },
                503,
            );
        }
    },
);

export default payment;
