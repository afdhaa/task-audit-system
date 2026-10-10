import { PrismaClient } from "@prisma/client";

export class AuditLogsRepository {
  constructor(private readonly prisma: PrismaClient) {}

  /**
   * Fetches audit log records for a given taskId in chronological order (createdAt ASC).
   * Read-only repository with no mutation methods to enforce append-only immutability.
   */
  async findByTaskId(taskId: string) {
    return this.prisma.auditLog.findMany({
      where: { taskId },
      orderBy: { createdAt: "asc" },
    });
  }
}
