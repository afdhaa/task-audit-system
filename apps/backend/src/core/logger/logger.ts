import winston from "winston";

const { combine, timestamp, printf, colorize, errors, json } = winston.format;

const isProduction = process.env.NODE_ENV === "production";

/**
 * Custom console format for clean, human-readable terminal output during development.
 */
const customConsoleFormat = printf(({ level, message, timestamp, stack, ...meta }) => {
  const metaString =
    Object.keys(meta).length > 0 ? ` ${JSON.stringify(meta)}` : "";
  const errorMessage = stack ? `\n${stack}` : "";
  return `[${timestamp}] [${level}]: ${message}${metaString}${errorMessage}`;
});

/**
 * Central Winston logger instance providing structured logging across backend modules.
 */
export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || "info",
  format: combine(
    timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    errors({ stack: true }),
    isProduction ? json() : combine(colorize(), customConsoleFormat)
  ),
  transports: [
    new winston.transports.Console({
      silent: process.env.NODE_ENV === "test" && process.env.ENABLE_TEST_LOGS !== "true",
    }),
  ],
});
