import { TaskStatus } from "../tasks.constants";

export interface TaskEntity {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  version: number;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}
