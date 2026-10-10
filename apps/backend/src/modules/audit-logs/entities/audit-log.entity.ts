import { TaskStatus } from "../../../modules/tasks/tasks.constants";

export interface AuditLogEntity {
  id: string;
  taskId: string;
  taskTitle: string;
  actor: string;
  fromStatus: TaskStatus;
  toStatus: TaskStatus;
  createdAt: Date;
}
