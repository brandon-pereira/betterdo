import z from "zod";
import { PRIORITIES } from "@betterdo/shared/constants";
import { listTitleSchema, prioritySchema, taskTitleSchema } from "@betterdo/shared/validation";
import { CUSTOM_LISTS } from "../services/customLists.js";
import { dueDateToCalendarDate } from "../utils/dueDate.js";
import type { Priority } from "@betterdo/shared/types";

// ---- Inputs ----

export const writableListIdSchema = z
  .union([z.literal("inbox"), z.uuid()])
  .describe('A list ID from get_lists, or "inbox" for the user\'s inbox.');

export const listIdSchema = z
  .union([z.literal("inbox"), z.enum(CUSTOM_LISTS), z.uuid()])
  .describe(
    'A list ID from get_lists, "inbox" for the user\'s inbox, or a smart list: ' +
      '"today", "tomorrow", "overdue", "week" (due this week), "highPriority".'
  );

export const taskIdSchema = z.uuid().describe("A task ID from get_tasks.");

export const calendarDateSchema = z.iso.date().describe("Calendar date in the user's timezone, formatted YYYY-MM-DD.");

export const colorSchema = z
  .string()
  .regex(/^#[0-9a-fA-F]{6}$/, "Color must be a hex code like #3b82f6")
  .describe("Hex color, e.g. #3b82f6.");

export { listTitleSchema, prioritySchema, taskTitleSchema };

// ---- Outputs ----

export const taskSummarySchema = z.object({
  id: z.string(),
  title: z.string(),
  listId: z.string(),
  isCompleted: z.boolean(),
  priority: z.enum(PRIORITIES).nullable(),
  dueDate: z.string().nullable().describe("YYYY-MM-DD in the user's timezone"),
  completedAt: z.string().nullable().describe("ISO timestamp")
});

export const taskDetailSchema = taskSummarySchema.extend({
  notes: z.string().nullable(),
  createdAt: z.string().nullable(),
  updatedAt: z.string().nullable(),
  createdBy: z.object({ id: z.string(), name: z.string(), email: z.string().nullable() }).nullable(),
  list: z.object({ id: z.string(), title: z.string() })
});

export const listSummarySchema = z.object({
  id: z.string(),
  title: z.string(),
  type: z.enum(["inbox", "default", "smart"]).describe("Smart lists are read-only, computed views across all lists"),
  color: z.string(),
  incompleteTaskCount: z.number(),
  completedTaskCount: z.number(),
  memberCount: z.number().describe("Greater than 1 when the list is shared")
});

export type TaskSummary = z.infer<typeof taskSummarySchema>;
export type ListSummary = z.infer<typeof listSummarySchema>;

// ---- Formatters ----

interface TaskLike {
  id: string;
  title: string;
  listId: string;
  isCompleted: boolean;
  priority: Priority | null;
  dueDate: Date | null;
  completedAt: Date | null;
}

export const toIsoString = (date: Date | null | undefined) => (date ? date.toISOString() : null);

export function toTaskSummary(task: TaskLike): TaskSummary {
  return {
    id: task.id,
    title: task.title,
    listId: task.listId,
    isCompleted: task.isCompleted,
    priority: task.priority,
    dueDate: dueDateToCalendarDate(task.dueDate),
    completedAt: toIsoString(task.completedAt)
  };
}

// Tool results carry both a machine-readable `structuredContent` (validated
// against the tool's outputSchema) and a text rendering for older clients.
export function toolResult<T extends Record<string, unknown>>(output: T) {
  return {
    content: [{ type: "text" as const, text: JSON.stringify(output) }],
    structuredContent: output
  };
}

export function toolError(message: string) {
  return {
    content: [{ type: "text" as const, text: message }],
    isError: true
  };
}
