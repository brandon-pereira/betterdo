import z, { uuid, uuidv4 } from "zod";

export const createTaskSchema = z.object({
  listId: z.uuid("List ID"),
  title: z.string().min(1, "Title is required")
});

export const updateTaskSchema = z.object({
  title: z.string().min(1, "Title is required").optional(),
  isCompleted: z.boolean().optional(),
  priority: z.enum(["low", "normal", "high"]).optional().nullable(),
  dueDate: z.iso.datetime().optional().nullable(),
  listId: z.uuid("List ID").optional(),
  notes: z.string().optional().nullable(),
  subtasks: z
    .array(
      z.object({
        // Random ID by default
        id: z.string().default(() => Math.random().toString(36).substring(2, 15)),
        title: z.string().min(1, "Subtask title is required"),
        isComplete: z.boolean().default(false)
      })
    )
    .optional()
});
