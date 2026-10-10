import { Request, Response, NextFunction } from "express";
import { logger } from "../logger/logger";

/**
 * Middleware that logs incoming HTTP requests and their completion status with response duration.
 */
export function requestLoggerMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const start = Date.now();
  const { method, originalUrl } = req;

  res.on("finish", () => {
    const duration = Date.now() - start;
    const { statusCode } = res;
    const message = `${method} ${originalUrl} ${statusCode} - ${duration}ms`;

    if (statusCode >= 500) {
      logger.error(message, { method, url: originalUrl, statusCode, duration });
    } else if (statusCode >= 400) {
      logger.warn(message, { method, url: originalUrl, statusCode, duration });
    } else {
      logger.info(message, { method, url: originalUrl, statusCode, duration });
    }
  });

  next();
}
