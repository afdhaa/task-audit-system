import { TaskStatus } from "../../../modules/tasks/tasks.constants";

export interface AuditLogResponseDto {
  id: string;
  taskId: string;
  taskTitle: string;
  actor: string;
  fromStatus: TaskStatus;
  toStatus: TaskStatus;
  createdAt: Date;
  message: string;
}
