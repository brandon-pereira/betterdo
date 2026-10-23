import z from "zod";
import { dateStringSchema, prioritySchema, taskTitleSchema } from "@betterdo/shared/validation";

// Kept as a string so the route handler can apply the user's timezone (the
// validator has no access to the authenticated user).
const dueDateSchema = dateStringSchema.optional().nullable();

export const createTaskSchema = z.object({
  listId: z.string().min(1, "List ID is required"),
  title: taskTitleSchema,
  dueDate: dueDateSchema
});

export const updateTaskSchema = z.object({
  title: taskTitleSchema.optional(),
  isCompleted: z.boolean().optional(),
  priority: prioritySchema.optional().nullable(),
  dueDate: dueDateSchema,
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
    .nullable()
});
