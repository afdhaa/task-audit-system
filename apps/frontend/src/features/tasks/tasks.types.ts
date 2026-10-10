import { TaskStatus } from "../../shared/constants";

export interface Task {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTaskInput {
  title: string;
  description?: string;
}

export interface UpdateTaskStatusInput {
  status: TaskStatus;
  actor: string;
}
