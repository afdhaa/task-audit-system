import { describe, it, expect, beforeEach, vi } from "vitest";
import request from "supertest";
import { inMemoryPrisma } from "../../../test/in-memory-prisma";
import { PrismaClient } from "@prisma/client";

// Mock the real database connection with the in-memory Prisma client
vi.mock("../../../core/database/prisma.service", () => ({
  prisma: inMemoryPrisma,
  PrismaService: class {
    constructor() {
      return inMemoryPrisma;
    }
  },
}));

import { createApp } from "../../../app";

const app = createApp(inMemoryPrisma as unknown as PrismaClient);

describe("Task Management & Audit System Integration Tests (NestJS-Style Feature Modules)", () => {
  beforeEach(() => {
    // Reset in-memory database before each test for total test isolation
    inMemoryPrisma.reset();
  });

  it("should create a new task with initial status 'to_do'", async () => {
    const res = await request(app)
      .post("/api/tasks")
      .send({ title: "Test Task 1", description: "First test task" });

    expect(res.status).toBe(201);
    expect(res.body.data).toBeDefined();
    expect(res.body.data.title).toBe("Test Task 1");
    expect(res.body.data.status).toBe("to_do");
    expect(res.body.data.id).toBeDefined();
  });

  it("should list active tasks", async () => {
    await request(app).post("/api/tasks").send({ title: "Task A" });
    await request(app).post("/api/tasks").send({ title: "Task B" });

    const res = await request(app).get("/api/tasks");
    expect(res.status).toBe(200);
    expect(res.body.data).toBeInstanceOf(Array);
    expect(res.body.data).toHaveLength(2);
  });

  it("should filter active tasks by status query parameter", async () => {
    const taskA = await request(app).post("/api/tasks").send({ title: "Task A" });
    const taskB = await request(app).post("/api/tasks").send({ title: "Task B" });
    await request(app)
      .put(`/api/tasks/${taskB.body.data.id}/status`)
      .send({ status: "pending", actor: "john.doe" });

    // Query status=to_do
    const todoRes = await request(app).get("/api/tasks?status=to_do");
    expect(todoRes.status).toBe(200);
    expect(todoRes.body.data).toHaveLength(1);
    expect(todoRes.body.data[0].id).toBe(taskA.body.data.id);

    // Query status=pending
    const pendingRes = await request(app).get("/api/tasks?status=pending");
    expect(pendingRes.status).toBe(200);
    expect(pendingRes.body.data).toHaveLength(1);
    expect(pendingRes.body.data[0].id).toBe(taskB.body.data.id);
  });

  it("should execute valid sequential transitions and create audit logs", async () => {
    // 1. Create a fresh task
    const createRes = await request(app)
      .post("/api/tasks")
      .send({ title: "Sequential Task" });
    const taskId = createRes.body.data.id;

    // 2. Transition: to_do -> pending
    const step1 = await request(app)
      .put(`/api/tasks/${taskId}/status`)
      .send({ status: "pending", actor: "john.doe" });
    expect(step1.status).toBe(200);
    expect(step1.body.data.task.status).toBe("pending");
    expect(step1.body.data.idempotent).toBe(false);
    expect(step1.body.data.auditLog).toBeDefined();
    expect(step1.body.data.auditLog.fromStatus).toBe("to_do");
    expect(step1.body.data.auditLog.toStatus).toBe("pending");
    expect(step1.body.data.auditLog.actor).toBe("john.doe");

    // 3. Transition: pending -> in_progress
    const step2 = await request(app)
      .put(`/api/tasks/${taskId}/status`)
      .send({ status: "in_progress", actor: "jane.smith" });
    expect(step2.status).toBe(200);
    expect(step2.body.data.task.status).toBe("in_progress");
    expect(step2.body.data.auditLog.fromStatus).toBe("pending");
    expect(step2.body.data.auditLog.toStatus).toBe("in_progress");

    // 4. Transition: in_progress -> done
    const step3 = await request(app)
      .put(`/api/tasks/${taskId}/status`)
      .send({ status: "done", actor: "alice.walker" });
    expect(step3.status).toBe(200);
    expect(step3.body.data.task.status).toBe("done");
    expect(step3.body.data.auditLog.fromStatus).toBe("in_progress");
    expect(step3.body.data.auditLog.toStatus).toBe("done");

    // 5. Verify chronological audit logs
    const logsRes = await request(app).get(`/api/tasks/${taskId}/audit-logs`);
    expect(logsRes.status).toBe(200);
    expect(logsRes.body.data).toHaveLength(3);
    expect(logsRes.body.data[0].fromStatus).toBe("to_do");
    expect(logsRes.body.data[0].toStatus).toBe("pending");
    expect(logsRes.body.data[1].fromStatus).toBe("pending");
    expect(logsRes.body.data[1].toStatus).toBe("in_progress");
    expect(logsRes.body.data[2].fromStatus).toBe("in_progress");
    expect(logsRes.body.data[2].toStatus).toBe("done");
  });

  it("should reject invalid status transitions with 400 Bad Request", async () => {
    // Create fresh task (status: to_do)
    const createRes = await request(app)
      .post("/api/tasks")
      .send({ title: "Invalid Transition Task" });
    const taskId = createRes.body.data.id;

    // Attempt illegal transition: to_do -> in_progress (skipping pending)
    const badRes = await request(app)
      .put(`/api/tasks/${taskId}/status`)
      .send({ status: "in_progress", actor: "bob.wilson" });

    expect(badRes.status).toBe(400);
    expect(badRes.body.error).toContain("Invalid status transition");

    // Verify status was not modified
    const checkRes = await request(app).get("/api/tasks");
    const task = checkRes.body.data.find((t: { id: string }) => t.id === taskId);
    expect(task.status).toBe("to_do");

    // Verify 0 audit logs were created
    const logsRes = await request(app).get(`/api/tasks/${taskId}/audit-logs`);
    expect(logsRes.body.data).toHaveLength(0);
  });

  it("should handle same-status update as idempotent no-op without creating audit log", async () => {
    // Create fresh task (status: to_do)
    const createRes = await request(app)
      .post("/api/tasks")
      .send({ title: "Idempotent Task" });
    const taskId = createRes.body.data.id;

    // Send update to same status "to_do"
    const idemRes = await request(app)
      .put(`/api/tasks/${taskId}/status`)
      .send({ status: "to_do", actor: "john.doe" });

    expect(idemRes.status).toBe(200);
    expect(idemRes.body.data.idempotent).toBe(true);
    expect(idemRes.body.data.auditLog).toBeNull();

    // Verify NO audit logs created
    const logsRes = await request(app).get(`/api/tasks/${taskId}/audit-logs`);
    expect(logsRes.body.data).toHaveLength(0);
  });

  it("should rollback task status update if audit log creation fails", async () => {
    const createRes = await request(app)
      .post("/api/tasks")
      .send({ title: "Rollback Test Task" });
    const taskId = createRes.body.data.id;

    // Simulate failure during audit log insertion inside the transaction
    inMemoryPrisma.failNextAuditLogCreate = true;

    const failRes = await request(app)
      .put(`/api/tasks/${taskId}/status`)
      .send({ status: "pending", actor: "john.doe" });

    expect(failRes.status).toBe(500);

    // Verify task status was rolled back to initial 'to_do'
    const checkRes = await request(app).get("/api/tasks");
    const task = checkRes.body.data.find((t: { id: string }) => t.id === taskId);
    expect(task.status).toBe("to_do");

    // Verify 0 audit logs were committed
    const logsRes = await request(app).get(`/api/tasks/${taskId}/audit-logs`);
    expect(logsRes.body.data).toHaveLength(0);
  });

  it("should soft delete task, excluding it from active list while preserving audit logs", async () => {
    // Create task
    const createRes = await request(app)
      .post("/api/tasks")
      .send({ title: "Task to Delete" });
    const taskId = createRes.body.data.id;

    // Update status to pending (creates 1 audit log)
    await request(app)
      .put(`/api/tasks/${taskId}/status`)
      .send({ status: "pending", actor: "john.doe" });

    // Delete task
    const deleteRes = await request(app).delete(`/api/tasks/${taskId}`);
    expect(deleteRes.status).toBe(200);

    // Verify task is NOT in active list
    const listRes = await request(app).get("/api/tasks");
    const exists = listRes.body.data.some((t: { id: string }) => t.id === taskId);
    expect(exists).toBe(false);

    // Verify audit logs are completely preserved and intact
    const logsRes = await request(app).get(`/api/tasks/${taskId}/audit-logs`);
    expect(logsRes.status).toBe(200);
    expect(logsRes.body.data).toHaveLength(1);
    expect(logsRes.body.data[0].taskTitle).toBe("Task to Delete");
    expect(logsRes.body.data[0].fromStatus).toBe("to_do");
    expect(logsRes.body.data[0].toStatus).toBe("pending");
  });

  it("should return 404 for non-existent task operations", async () => {
    const nonExistentId = "00000000-0000-0000-0000-000000000000";

    const updateRes = await request(app)
      .put(`/api/tasks/${nonExistentId}/status`)
      .send({ status: "pending", actor: "john.doe" });
    expect(updateRes.status).toBe(404);

    const deleteRes = await request(app).delete(`/api/tasks/${nonExistentId}`);
    expect(deleteRes.status).toBe(404);

    const logsRes = await request(app).get(`/api/tasks/${nonExistentId}/audit-logs`);
    expect(logsRes.status).toBe(404);
  });

  it("should maintain consistency under concurrent updates to same task", async () => {
    const createRes = await request(app)
      .post("/api/tasks")
      .send({ title: "Concurrent Race Task" });
    const taskId = createRes.body.data.id;

    // Fire two simultaneous requests attempting to transition to_do -> pending
    const [resA, resB] = await Promise.all([
      request(app)
        .put(`/api/tasks/${taskId}/status`)
        .send({ status: "pending", actor: "actor.alice" }),
      request(app)
        .put(`/api/tasks/${taskId}/status`)
        .send({ status: "pending", actor: "actor.bob" }),
    ]);

    // Status codes should be either 200 (success or idempotent) or 409 (conflict)
    expect([200, 409]).toContain(resA.status);
    expect([200, 409]).toContain(resB.status);

    // Crucially: exactly ONE audit log must exist for the transition to_do -> pending
    const logsRes = await request(app).get(`/api/tasks/${taskId}/audit-logs`);
    expect(logsRes.status).toBe(200);
    expect(logsRes.body.data).toHaveLength(1);
    expect(logsRes.body.data[0].toStatus).toBe("pending");
  });
});
