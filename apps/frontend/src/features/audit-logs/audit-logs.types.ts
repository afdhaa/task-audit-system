import { TaskStatus } from "../../shared/constants";

export interface AuditLog {
  id: string;
  taskId: string;
  taskTitle: string;
  actor: string;
  fromStatus: TaskStatus;
  toStatus: TaskStatus;
  createdAt: string;
  message: string;
}
