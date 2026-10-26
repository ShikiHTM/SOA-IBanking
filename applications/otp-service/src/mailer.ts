import "dotenv/config";
import nodemailer from "nodemailer";
import logger from "@soa/shared/log";
import { redis } from "./redis";

export const EMAIL_QUEUE_KEY = "queue:otp_email";
const MAX_RETRIES = 3;

export type OtpEmailJob = {
    to: string;
    otp: string;
    transactionId: string;
    attempts?: number;
};

const port = Number(process.env["SMTP_PORT"] ?? 587);

export const transporter = nodemailer.createTransport({
    pool: true,
    host: process.env["SMTP_HOST"],
    port,
    secure: port === 465,
    auth: {
        user: process.env["SMTP_USER"],
        pass: process.env["SMTP_PASS"],
    },
});

export async function sendOtpEmail(to: string, otp: string, transactionId: string): Promise<void> {
    await transporter.sendMail({
        from: process.env["SMTP_FROM"] ?? process.env["SMTP_USER"],
        to,
        subject: "Your Tuition Payment OTP Code",
        text: `Your OTP for transaction ${transactionId} is ${otp}. This code will expire in 5 minutes.`,
        html: `<p>Your OTP for transaction <b>${transactionId}</b> is <h2>${otp}</h2></p><p>This code will expire in 5 minutes.</p>`,
    });
}

export async function enqueueOtpEmail(job: OtpEmailJob): Promise<void> {
    await redis.lpush(EMAIL_QUEUE_KEY, JSON.stringify({ ...job, attempts: job.attempts ?? 0 }));
}

// Background worker using a dedicated Redis connection so BRPOP does not block regular commands
export function startMailWorker(): void {
    const workerRedis = redis.duplicate();

    workerRedis.on("error", (err) => {
        logger.error("Mail worker Redis error:", err);
    });

    const processQueue = async () => {
        logger.info("OTP Mail Worker started and listening for jobs...");

        for (;;) {
            try {
                const result = await workerRedis.brpop(EMAIL_QUEUE_KEY, 0);
                if (!result) {
                    continue;
                }

                const [, payload] = result;
                const job = JSON.parse(payload) as OtpEmailJob;
                const attempts = job.attempts ?? 0;

                try {
                    await sendOtpEmail(job.to, job.otp, job.transactionId);
                    logger.info(`Sent OTP email to ${job.to} for transaction ${job.transactionId}`);
                } catch (sendError) {
                    logger.error(`Failed to send OTP email to ${job.to} (attempt ${attempts + 1}):`, sendError);

                    if (attempts + 1 < MAX_RETRIES) {
                        await enqueueOtpEmail({ ...job, attempts: attempts + 1 });
                    }
                }
            } catch (error) {
                logger.error("Mail worker queue processing error:", error);
                await new Promise((resolve) => setTimeout(resolve, 1000));
            }
        }
    };

    void processQueue();
}
