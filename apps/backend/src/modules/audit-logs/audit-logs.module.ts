import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import { AuditLogsRepository } from "./audit-logs.repository";
import { AuditLogsService } from "./audit-logs.service";
import { AuditLogsController } from "./audit-logs.controller";

export class AuditLogsModule {
  /**
   * Factory method assembling all layers of AuditLogsModule and binding endpoints to an Express Router.
   *
   * @param prisma - PrismaClient instance for database access
   * @returns Object exposing the router, service, repository, and controller instances
   */
  public static init(prisma: PrismaClient): {
    router: Router;
    service: AuditLogsService;
    repository: AuditLogsRepository;
    controller: AuditLogsController;
  } {
    const repository = new AuditLogsRepository(prisma);
    const service = new AuditLogsService(repository, prisma);
    const controller = new AuditLogsController(service);

    const router = Router();
    router.get("/:id/audit-logs", controller.getAuditLogsByTaskId);

    return { router, service, repository, controller };
  }
}
