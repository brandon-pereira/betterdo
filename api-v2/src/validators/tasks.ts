import z from "zod";

// The frontend sends dueDate as a UTC date string (via Date.prototype.toUTCString),
// which is RFC-1123 rather than strict ISO-8601. Accept any string that Date can
// parse and leave it as a string so the route handler can apply the user's timezone
// (the validator has no access to the authenticated user's timeZone).
const dueDateSchema = z
  .string()
  .refine(value => !Number.isNaN(new Date(value).getTime()), {
    message: "Invalid date"
  })
  .optional()
  .nullable();

export const createTaskSchema = z.object({
  listId: z.string().min(1, "List ID is required"),
  title: z.string().min(1, "Title is required"),
  dueDate: dueDateSchema
});

export const updateTaskSchema = z.object({
  title: z.string().min(1, "Title is required").optional(),
  isCompleted: z.boolean().optional(),
  priority: z.enum(["low", "normal", "high"]).optional().nullable(),
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
