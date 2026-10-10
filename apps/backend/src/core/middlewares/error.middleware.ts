import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import { AppError } from "../errors/app-error";
import { logger } from "../logger/logger";

/**
 * Global error handling middleware ensuring consistent error response formats.
 * Handles Zod validation errors (400), custom domain AppErrors (400, 404, 409), and unexpected 500 errors.
 */
export function errorMiddleware(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (err instanceof ZodError) {
    logger.warn(`Validation Error on ${_req.method} ${_req.originalUrl}`, {
      details: err.flatten().fieldErrors,
    });
    res.status(400).json({
      error: "Validation Error",
      details: err.flatten().fieldErrors,
    });
    return;
  }

  if (err instanceof AppError) {
    logger.warn(`Domain AppError (${err.statusCode}): ${err.message}`, {
      method: _req.method,
      url: _req.originalUrl,
      statusCode: err.statusCode,
      details: err.details,
    });
    res.status(err.statusCode).json({
      error: err.message,
      ...(err.details ? { details: err.details } : {}),
    });
    return;
  }

  logger.error(`Unhandled error on ${_req.method} ${_req.originalUrl}: ${err.message}`, {
    stack: err.stack,
  });
  res.status(500).json({
    error: "Internal server error",
  });
}
