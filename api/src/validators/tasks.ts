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
  notes: z.string().optional().nullable()
});
