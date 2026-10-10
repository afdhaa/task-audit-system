import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import { TasksModule } from "./modules/tasks/tasks.module";
import { AuditLogsModule } from "./modules/audit-logs/audit-logs.module";

export class AppModule {
  /**
   * Aggregates and mounts all feature module routers onto a single Express Router.
   *
   * @param prisma - PrismaClient instance injected into each feature module
   * @returns Express Router containing all registered API endpoints
   */
  public static registerRoutes(prisma: PrismaClient): Router {
    const apiRouter = Router();

    const tasksModule = TasksModule.init(prisma);
    const auditLogsModule = AuditLogsModule.init(prisma);

    apiRouter.use("/tasks", tasksModule.router);
    apiRouter.use("/tasks", auditLogsModule.router);

    return apiRouter;
  }
}
