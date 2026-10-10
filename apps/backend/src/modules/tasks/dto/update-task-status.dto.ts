import { z } from "zod";
import { TaskStatus } from "../tasks.constants";

export const updateTaskStatusSchema = z.object({
  status: z.nativeEnum(TaskStatus, {
    errorMap: () => ({
      message:
        "Invalid status value. Must be to_do, pending, in_progress, or done.",
    }),
  }),
  actor: z
    .string({ required_error: "Actor is required" })
    .trim()
    .min(1, "Actor cannot be empty")
    .max(100, "Actor cannot exceed 100 characters"),
});

export type UpdateTaskStatusDto = z.infer<typeof updateTaskStatusSchema>;
