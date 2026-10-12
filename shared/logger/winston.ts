import { createLogger, format, transports } from "winston";
import "winston-daily-rotate-file";

const consoleFormat = format.combine(
    format.colorize(),
    format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    format.errors({ stack: true }),
    format.printf(({ level, message, timestamp, stack, ...metadata }) => {
        let log = `${String(timestamp)} [${level}]: ${String(stack ?? message)}`;
        if (Object.keys(metadata).length > 0) {
            log += ` ${JSON.stringify(metadata)}`;
        }
        return log;
    }),
);

const fileFormat = format.combine(
    format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    format.errors({ stack: true }),
    format.json(),
);

const combinedFileTransport = new transports.DailyRotateFile({
    filename: "logs/combined-%DATE%.log",
    datePattern: "YYYY-MM-DD",
    zippedArchive: true,
    maxSize: "20m",
    maxFiles: "14d",
    format: fileFormat,
    level: "info",
});

const errorFileTransport = new transports.DailyRotateFile({
    filename: "logs/error-%DATE%.log",
    datePattern: "YYYY-MM-DD",
    zippedArchive: true,
    maxSize: "20m",
    maxFiles: "30d",
    format: fileFormat,
    level: "error",
});

const logger = createLogger({
    level: process.env.NODE_ENV === "production" ? "info" : "debug",
    transports: [combinedFileTransport, errorFileTransport],
    exceptionHandlers: [
        new transports.DailyRotateFile({
            filename: "logs/exceptions-%DATE%.log",
            datePattern: "YYYY-MM-DD",
            maxFiles: "30d",
        }),
    ],
    rejectionHandlers: [
        new transports.DailyRotateFile({
            filename: "logs/rejections-%DATE%.log",
            datePattern: "YYYY-MM-DD",
            maxFiles: "30d",
        }),
    ],
});

if (process.env.NODE_ENV !== "production") {
    logger.add(
        new transports.Console({
            format: consoleFormat,
        }),
    );
}

export default logger;
