import { PrismaClient } from "@prisma/client";
import { TasksRepository } from "./tasks.repository";
import { CreateTaskDto } from "./dto/create-task.dto";
import { UpdateTaskStatusDto } from "./dto/update-task-status.dto";
import {
  NotFoundError,
  BadRequestError,
  ConflictError,
} from "../../core/errors/app-error";
import {
  TaskStatus,
  isValidTransition,
  ALLOWED_TRANSITIONS,
  formatAuditMessage,
} from "./tasks.constants";
import { logger } from "../../core/logger/logger";

export class TasksService {
  constructor(
    private readonly repo: TasksRepository,
    private readonly prisma: PrismaClient
  ) {}

  /**
   * Retrieves all active tasks for the task dashboard.
   */
  async getAllTasks(status?: TaskStatus) {
    return this.repo.findAllActive(status);
  }

  /**
   * Retrieves a single active task by ID. Throws NotFoundError if missing or soft-deleted.
   */
  async getTaskById(id: string) {
    const task = await this.repo.findByIdActive(id);
    if (!task) {
      throw new NotFoundError(`Task with id '${id}' not found`);
    }
    return task;
  }

  /**
   * Creates a new task with default initial status 'to_do'.
   */
  async createTask(dto: CreateTaskDto) {
    const task = await this.repo.create(dto);
    logger.info(`Task created: "${task.title}" (id: ${task.id})`, {
      taskId: task.id,
      title: task.title,
      status: task.status,
    });
    return task;
  }

  /**
   * Updates task status with optimistic locking, strict transition validation,
   * same-status idempotency, and atomic audit logging within a database transaction.
   */
  async updateStatus(id: string, dto: UpdateTaskStatusDto) {
    const { status: targetStatus, actor } = dto;

    return this.prisma.$transaction(async (tx) => {
      const currentTask = await tx.task.findFirst({
        where: { id, deletedAt: null },
      });

      if (!currentTask) {
        throw new NotFoundError(`Task with id '${id}' not found`);
      }

      // Idempotency check: same-status is a no-op, creates NO audit log
      if (currentTask.status === targetStatus) {
        logger.info(`Idempotent status update: Task ${id} already in status '${targetStatus}'`, {
          taskId: id,
          status: targetStatus,
          actor,
        });
        return {
          task: currentTask,
          auditLog: null,
          idempotent: true,
          message: `Task is already in '${targetStatus}' status. No change made.`,
        };
      }

      // Domain transition validation
      if (!isValidTransition(currentTask.status, targetStatus)) {
        const expected = ALLOWED_TRANSITIONS[currentTask.status];
        const detail = expected
          ? `Allowed transition from '${currentTask.status}' is only to '${expected}'.`
          : `Status '${currentTask.status}' is a terminal state and cannot transition further.`;
        throw new BadRequestError(
          `Invalid status transition from '${currentTask.status}' to '${targetStatus}'. ${detail}`
        );
      }

      // Concurrency check via optimistic locking
      const updateResult = await tx.task.updateMany({
        where: {
          id,
          status: currentTask.status,
          version: currentTask.version,
          deletedAt: null,
        },
        data: {
          status: targetStatus,
          version: { increment: 1 },
        },
      });

      if (updateResult.count === 0) {
        throw new ConflictError(
          "Concurrent update detected: Task status was modified by another operation. Please refresh and retry."
        );
      }

      // Atomically create immutable audit log
      const auditLog = await tx.auditLog.create({
        data: {
          taskId: currentTask.id,
          taskTitle: currentTask.title,
          actor,
          fromStatus: currentTask.status,
          toStatus: targetStatus,
        },
      });

      const updatedTask = await tx.task.findUniqueOrThrow({
        where: { id },
      });

      logger.info(
        `Task ${id} status advanced: '${currentTask.status}' -> '${targetStatus}' by actor '${actor}'`,
        {
          taskId: id,
          fromStatus: currentTask.status,
          toStatus: targetStatus,
          actor,
        }
      );

      return {
        task: updatedTask,
        auditLog: {
          ...auditLog,
          message: formatAuditMessage(
            auditLog.actor,
            auditLog.taskTitle,
            auditLog.fromStatus,
            auditLog.toStatus,
            auditLog.createdAt
          ),
        },
        idempotent: false,
        message: `Status successfully updated from '${currentTask.status}' to '${targetStatus}'.`,
      };
    });
  }

  /**
   * Soft-deletes a task by setting deletedAt, excluding it from active queries while preserving audit logs.
   */
  async deleteTask(id: string) {
    const existing = await this.repo.findByIdActive(id);
    if (!existing) {
      throw new NotFoundError(`Task with id '${id}' not found`);
    }
    await this.repo.softDelete(id);
    logger.info(`Task soft-deleted: (id: ${id})`, { taskId: id });
    return { success: true, message: `Task '${id}' successfully deleted` };
  }
}
