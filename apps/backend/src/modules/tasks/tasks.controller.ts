import { Request, Response, NextFunction } from "express";
import { TasksService } from "./tasks.service";
import { createTaskSchema } from "./dto/create-task.dto";
import { updateTaskStatusSchema } from "./dto/update-task-status.dto";
import { taskIdParamSchema } from "./dto/task-param.dto";
import { getTasksQuerySchema } from "./dto/get-tasks-query.dto";

export class TasksController {
  constructor(private readonly service: TasksService) {}

  /**
   * HTTP GET /api/tasks: Returns all active tasks (HTTP 200).
   */
  getAllTasks = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const query = getTasksQuerySchema.parse(req.query);
      const tasks = await this.service.getAllTasks(query.status);
      res.status(200).json({ data: tasks });
    } catch (err) {
      next(err);
    }
  };

  /**
   * HTTP POST /api/tasks: Validates request payload and creates a new task (HTTP 201).
   */
  createTask = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const validated = createTaskSchema.parse(req.body);
      const created = await this.service.createTask(validated);
      res.status(201).json({ data: created });
    } catch (err) {
      next(err);
    }
  };

  /**
   * HTTP PUT /api/tasks/:id/status: Validates UUID param and payload,
   * then executes status transition with atomic audit logging (HTTP 200).
   */
  updateStatus = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { id } = taskIdParamSchema.parse(req.params);
      const validated = updateTaskStatusSchema.parse(req.body);
      const result = await this.service.updateStatus(id, validated);
      res.status(200).json({ data: result });
    } catch (err) {
      next(err);
    }
  };

  /**
   * HTTP DELETE /api/tasks/:id: Performs soft delete on the specified task (HTTP 200).
   */
  deleteTask = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { id } = taskIdParamSchema.parse(req.params);
      const result = await this.service.deleteTask(id);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  };
}
