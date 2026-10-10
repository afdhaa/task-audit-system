import { Request, Response, NextFunction } from "express";
import { AuditLogsService } from "./audit-logs.service";
import { taskIdParamSchema } from "../tasks/dto/task-param.dto";

export class AuditLogsController {
  constructor(private readonly service: AuditLogsService) {}

  /**
   * HTTP GET /api/tasks/:id/audit-logs: Returns chronological status transition logs (HTTP 200).
   */
  getAuditLogsByTaskId = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { id } = taskIdParamSchema.parse(req.params);
      const logs = await this.service.getAuditLogsByTaskId(id);
      res.status(200).json({ data: logs });
    } catch (err) {
      next(err);
    }
  };
}
