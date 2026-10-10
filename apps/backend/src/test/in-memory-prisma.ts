import crypto from "crypto";
import { TaskStatus } from "../modules/tasks/tasks.constants";

export interface MockTask {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  version: number;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface MockAuditLog {
  id: string;
  taskId: string;
  taskTitle: string;
  actor: string;
  fromStatus: TaskStatus;
  toStatus: TaskStatus;
  createdAt: Date;
}

export class InMemoryPrismaClient {
  private tasks = new Map<string, MockTask>();
  private auditLogs: MockAuditLog[] = [];
  public failNextAuditLogCreate = false;

  private cloneState(): { tasks: Map<string, MockTask>; auditLogs: MockAuditLog[] } {
    const tasksCopy = new Map<string, MockTask>();
    for (const [k, v] of this.tasks.entries()) {
      tasksCopy.set(k, { ...v });
    }
    const auditCopy = this.auditLogs.map((l) => ({ ...l }));
    return { tasks: tasksCopy, auditLogs: auditCopy };
  }

  public reset() {
    this.tasks.clear();
    this.auditLogs = [];
    this.failNextAuditLogCreate = false;
  }

  get task() {
    return {
      findMany: async (args?: {
        where?: { deletedAt?: null | Date; status?: TaskStatus };
        orderBy?: { createdAt?: "asc" | "desc" };
        select?: Record<string, boolean>;
      }) => {
        let list = Array.from(this.tasks.values());

        if (args?.where) {
          if (args.where.deletedAt === null) {
            list = list.filter((t) => t.deletedAt === null);
          }
          if (args.where.status) {
            list = list.filter((t) => t.status === args.where!.status);
          }
        }

        if (args?.orderBy?.createdAt) {
          const dir = args.orderBy.createdAt === "desc" ? -1 : 1;
          list.sort((a, b) => (a.createdAt.getTime() - b.createdAt.getTime()) * dir);
        }

        return list;
      },

      findFirst: async (args: { where: { id: string; deletedAt?: null | Date } }) => {
        const item = this.tasks.get(args.where.id);
        if (!item) return null;
        if (args.where.deletedAt === null && item.deletedAt !== null) {
          return null;
        }
        return { ...item };
      },

      findUnique: async (args: { where: { id: string } }) => {
        const item = this.tasks.get(args.where.id);
        return item ? { ...item } : null;
      },

      findUniqueOrThrow: async (args: { where: { id: string } }) => {
        const item = this.tasks.get(args.where.id);
        if (!item) throw new Error(`Task '${args.where.id}' not found`);
        return { ...item };
      },

      create: async (args: {
        data: { title: string; description?: string | null; status?: TaskStatus };
        select?: Record<string, boolean>;
      }) => {
        const now = new Date();
        const newTask: MockTask = {
          id: crypto.randomUUID(),
          title: args.data.title,
          description: args.data.description ?? null,
          status: args.data.status ?? TaskStatus.to_do,
          version: 1,
          deletedAt: null,
          createdAt: now,
          updatedAt: now,
        };
        this.tasks.set(newTask.id, newTask);
        return { ...newTask };
      },

      update: async (args: {
        where: { id: string };
        data: { deletedAt?: Date | null; status?: TaskStatus; version?: number };
      }) => {
        const item = this.tasks.get(args.where.id);
        if (!item) throw new Error(`Task '${args.where.id}' not found`);
        const updated = {
          ...item,
          ...args.data,
          updatedAt: new Date(),
        };
        this.tasks.set(item.id, updated);
        return { ...updated };
      },

      updateMany: async (args: {
        where: {
          id: string;
          status: TaskStatus;
          version: number;
          deletedAt?: null | Date;
        };
        data: {
          status: TaskStatus;
          version: { increment: number } | number;
        };
      }) => {
        const item = this.tasks.get(args.where.id);
        if (!item) return { count: 0 };
        if (args.where.deletedAt === null && item.deletedAt !== null) {
          return { count: 0 };
        }
        if (item.status !== args.where.status || item.version !== args.where.version) {
          return { count: 0 };
        }

        const nextVersion =
          typeof args.data.version === "object" && "increment" in args.data.version
            ? item.version + args.data.version.increment
            : (args.data.version as number);

        this.tasks.set(item.id, {
          ...item,
          status: args.data.status,
          version: nextVersion,
          updatedAt: new Date(),
        });

        return { count: 1 };
      },

      deleteMany: async () => {
        const count = this.tasks.size;
        this.tasks.clear();
        return { count };
      },
    };
  }

  get auditLog() {
    return {
      findMany: async (args: {
        where: { taskId: string };
        orderBy?: { createdAt?: "asc" | "desc" };
      }) => {
        let list = this.auditLogs.filter((l) => l.taskId === args.where.taskId);
        if (args?.orderBy?.createdAt) {
          const dir = args.orderBy.createdAt === "desc" ? -1 : 1;
          list.sort((a, b) => (a.createdAt.getTime() - b.createdAt.getTime()) * dir);
        }
        return list.map((l) => ({ ...l }));
      },

      create: async (args: {
        data: {
          taskId: string;
          taskTitle: string;
          actor: string;
          fromStatus: TaskStatus;
          toStatus: TaskStatus;
        };
      }) => {
        if (this.failNextAuditLogCreate) {
          this.failNextAuditLogCreate = false;
          throw new Error("Simulated audit log insertion failure (testing transaction rollback)");
        }
        const newLog: MockAuditLog = {
          id: crypto.randomUUID(),
          taskId: args.data.taskId,
          taskTitle: args.data.taskTitle,
          actor: args.data.actor,
          fromStatus: args.data.fromStatus,
          toStatus: args.data.toStatus,
          createdAt: new Date(),
        };
        this.auditLogs.push(newLog);
        return { ...newLog };
      },

      deleteMany: async () => {
        const count = this.auditLogs.length;
        this.auditLogs = [];
        return { count };
      },
    };
  }

  async $transaction<T>(fn: (tx: InMemoryPrismaClient) => Promise<T>): Promise<T> {
    const snapshot = this.cloneState();
    try {
      return await fn(this);
    } catch (err) {
      // Rollback to pre-transaction snapshot on failure
      this.tasks = snapshot.tasks;
      this.auditLogs = snapshot.auditLogs;
      throw err;
    }
  }

  async $disconnect() {
    // No-op for in-memory client
  }
}

export const inMemoryPrisma = new InMemoryPrismaClient();
