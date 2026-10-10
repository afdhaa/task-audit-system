import express, { Express } from "express";
import cors from "cors";
import { PrismaClient } from "@prisma/client";
import { prisma as defaultPrisma } from "./core/database/prisma.service";
import { errorMiddleware } from "./core/middlewares/error.middleware";
import { requestLoggerMiddleware } from "./core/middlewares/request-logger.middleware";
import { AppModule } from "./app.module";

/**
 * Express application factory with database client dependency injection.
 * Registers global middlewares (CORS, JSON parser), health check endpoint, modular API routes, and error handler.
 *
 * @param prisma - PrismaClient instance (defaults to singleton PrismaService, mockable for testing)
 */
export function createApp(prisma: PrismaClient = defaultPrisma): Express {
  const app = express();

  app.use(cors());
  app.use(express.json());
  app.use(requestLoggerMiddleware);

  app.get("/health", (_req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  const apiRouter = AppModule.registerRoutes(prisma);
  app.use("/api", apiRouter);

  app.use(errorMiddleware);

  return app;
}
