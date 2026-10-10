import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import { TasksRepository } from "./tasks.repository";
import { TasksService } from "./tasks.service";
import { TasksController } from "./tasks.controller";

export class TasksModule {
  /**
   * Factory method assembling all layers of TasksModule (Repository -> Service -> Controller)
   * and binding endpoints to an Express Router.
   *
   * @param prisma - PrismaClient instance for database access
   * @returns Object exposing the router, service, repository, and controller instances
   */
  public static init(prisma: PrismaClient): {
    router: Router;
    service: TasksService;
    repository: TasksRepository;
    controller: TasksController;
  } {
    const repository = new TasksRepository(prisma);
    const service = new TasksService(repository, prisma);
    const controller = new TasksController(service);

    const router = Router();
    router.get("/", controller.getAllTasks);
    router.post("/", controller.createTask);
    router.put("/:id/status", controller.updateStatus);
    router.delete("/:id", controller.deleteTask);

    return { router, service, repository, controller };
  }
}
