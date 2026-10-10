import { z } from "zod";
import { TaskStatus } from "../tasks.constants";

export const getTasksQuerySchema = z.object({
  status: z.nativeEnum(TaskStatus).optional(),
});

export type GetTasksQueryDto = z.infer<typeof getTasksQuerySchema>;
