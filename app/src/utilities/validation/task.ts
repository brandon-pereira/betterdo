import { z } from "zod";
import { prioritySchema, taskTitleSchema } from "@betterdo/shared/validation";

// Client-side validation for the edit task form. Title/priority rules come from
// the shared package so they match what the API enforces.

export const editTaskSchema = z.object({
  title: taskTitleSchema,
  priority: prioritySchema,
  listId: z.string(),
  // DueDate emits `undefined` when cleared. The API returns `null` for empty
  // nullable columns; those are normalized when seeding the form, not here.
  dueDate: z.string().optional(),
  notes: z.string().optional()
});

export type EditTaskValues = z.input<typeof editTaskSchema>;
