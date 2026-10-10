import { PrismaClient, TaskStatus } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database with initial demo tasks and audit logs...");

  // Check if tasks already exist to avoid duplicate seeding
  const existingCount = await prisma.task.count();
  if (existingCount > 0) {
    console.log(`Database already contains ${existingCount} tasks. Skipping seeding.`);
    return;
  }

  // 1. Task in 'done' status (Completed through all stages)
  const task1 = await prisma.task.create({
    data: {
      title: "Prepare Monthly Invoice",
      description: "Generate and review invoice items for Q3 client billing.",
      status: TaskStatus.done,
      version: 4,
      createdAt: new Date(Date.now() - 3600 * 1000 * 4), // 4 hours ago
      auditLogs: {
        create: [
          {
            taskTitle: "Prepare Monthly Invoice",
            actor: "john.doe",
            fromStatus: TaskStatus.to_do,
            toStatus: TaskStatus.pending,
            createdAt: new Date(Date.now() - 3600 * 1000 * 3),
          },
          {
            taskTitle: "Prepare Monthly Invoice",
            actor: "jane.smith",
            fromStatus: TaskStatus.pending,
            toStatus: TaskStatus.in_progress,
            createdAt: new Date(Date.now() - 3600 * 1000 * 2),
          },
          {
            taskTitle: "Prepare Monthly Invoice",
            actor: "bob.wilson",
            fromStatus: TaskStatus.in_progress,
            toStatus: TaskStatus.done,
            createdAt: new Date(Date.now() - 3600 * 1000 * 1),
          },
        ],
      },
    },
  });

  // 2. Task in 'in_progress' status
  const task2 = await prisma.task.create({
    data: {
      title: "Database Performance Tuning",
      description: "Analyze slow queries and optimize composite indexes on PostgreSQL.",
      status: TaskStatus.in_progress,
      version: 3,
      createdAt: new Date(Date.now() - 3600 * 1000 * 2),
      auditLogs: {
        create: [
          {
            taskTitle: "Database Performance Tuning",
            actor: "alice.walker",
            fromStatus: TaskStatus.to_do,
            toStatus: TaskStatus.pending,
            createdAt: new Date(Date.now() - 3600 * 1000 * 1.5),
          },
          {
            taskTitle: "Database Performance Tuning",
            actor: "john.doe",
            fromStatus: TaskStatus.pending,
            toStatus: TaskStatus.in_progress,
            createdAt: new Date(Date.now() - 3600 * 1000 * 0.5),
          },
        ],
      },
    },
  });

  // 3. Task in 'pending' status
  const task3 = await prisma.task.create({
    data: {
      title: "Review Pull Request #42",
      description: "Review implementation of audit trail immutability and test coverage.",
      status: TaskStatus.pending,
      version: 2,
      createdAt: new Date(Date.now() - 3600 * 1000 * 1),
      auditLogs: {
        create: [
          {
            taskTitle: "Review Pull Request #42",
            actor: "jane.smith",
            fromStatus: TaskStatus.to_do,
            toStatus: TaskStatus.pending,
            createdAt: new Date(Date.now() - 3600 * 1000 * 0.5),
          },
        ],
      },
    },
  });

  // 4. Task in initial 'to_do' status
  const task4 = await prisma.task.create({
    data: {
      title: "Deploy Service to Staging Cluster",
      description: "Run smoke tests and verify Docker Compose deployment in staging.",
      status: TaskStatus.to_do,
      version: 1,
      createdAt: new Date(),
    },
  });

  console.log("Seeding completed successfully:");
  console.log(`- Created task: ${task1.title} (Status: done, 3 audit logs)`);
  console.log(`- Created task: ${task2.title} (Status: in_progress, 2 audit logs)`);
  console.log(`- Created task: ${task3.title} (Status: pending, 1 audit log)`);
  console.log(`- Created task: ${task4.title} (Status: to_do, 0 audit logs)`);
}

main()
  .catch((e) => {
    console.error("Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
