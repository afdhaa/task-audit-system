import { PrismaClient, TaskStatus } from "@prisma/client";
import { CreateTaskDto } from "./dto/create-task.dto";

export class TasksRepository {
  constructor(private readonly prisma: PrismaClient) {}

  /**
   * Fetches all active tasks (excluding soft-deleted rows), ordered newest first.
   */
  async findAllActive(status?: TaskStatus) {
    return this.prisma.task.findMany({
      where: {
        deletedAt: null,
        ...(status ? { status } : {}),
      },
      orderBy: { createdAt: "desc" },
    });
  }

  /**
   * Finds a single active task by its ID (ignores soft-deleted rows).
   */
  async findByIdActive(id: string) {
    return this.prisma.task.findFirst({
      where: { id, deletedAt: null },
    });
  }

  /**
   * Finds a task by its ID regardless of soft-delete status (preserves audit retention references).
   */
  async findById(id: string) {
    return this.prisma.task.findUnique({
      where: { id },
    });
  }

  /**
   * Persists a new task entity with initial status 'to_do'.
   */
  async create(data: CreateTaskDto) {
    return this.prisma.task.create({
      data: {
        title: data.title,
        description: data.description,
        status: "to_do",
      },
    });
  }

  /**
   * Performs soft delete by timestamping deletedAt, retaining row integrity for audit history.
   */
  async softDelete(id: string) {
    return this.prisma.task.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
