import { PrismaClient } from "@prisma/client";
import { AuditLogsRepository } from "./audit-logs.repository";
import { NotFoundError } from "../../core/errors/app-error";
import { formatAuditMessage } from "../tasks/tasks.constants";
import { AuditLogResponseDto } from "./dto/audit-log-response.dto";

export class AuditLogsService {
  constructor(
    private readonly repo: AuditLogsRepository,
    private readonly prisma: PrismaClient
  ) {}

  /**
   * Retrieves all chronological audit log records for a given task.
   * Remains accessible even if the parent task has been soft-deleted (audit retention guarantee).
   * Throws NotFoundError if the task does not exist in the database.
   */
  async getAuditLogsByTaskId(taskId: string): Promise<AuditLogResponseDto[]> {
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
    });

    if (!task) {
      throw new NotFoundError(`Task with id '${taskId}' not found`);
    }

    const logs = await this.repo.findByTaskId(taskId);

    return logs.map((log) => ({
      id: log.id,
      taskId: log.taskId,
      taskTitle: log.taskTitle,
      actor: log.actor,
      fromStatus: log.fromStatus,
      toStatus: log.toStatus,
      createdAt: log.createdAt,
      message: formatAuditMessage(
        log.actor,
        log.taskTitle,
        log.fromStatus,
        log.toStatus,
        log.createdAt
      ),
    }));
  }
}
