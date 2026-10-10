import { z } from "zod";

export const taskIdParamSchema = z.object({
  id: z.string().uuid("Invalid task ID format"),
});

export type TaskIdParamDto = z.infer<typeof taskIdParamSchema>;
