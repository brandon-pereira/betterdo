import z from "zod";
import type { McpServer } from "@modelcontextprotocol/server";
import { getListById, isUserAuthorizedToAccessList, resolveListId } from "../../services/lists.js";
import { getCustomListById, isCustomList, modifyTaskForCustomList } from "../../services/customLists.js";
import {
  createTaskWithNotification,
  getTaskById,
  getTaskDetailById,
  reorderTasks,
  updateTaskWithNotification
} from "../../services/tasks.js";
import { calendarDateToDueDate } from "../../utils/dueDate.js";
import {
  calendarDateSchema,
  listIdSchema,
  prioritySchema,
  taskDetailSchema,
  taskIdSchema,
  taskSummarySchema,
  taskTitleSchema,
  toIsoString,
  toolError,
  toolResult,
  toTaskSummary,
  writableListIdSchema
} from "../schemas.js";
import type { tasks } from "../../schema/task.js";
import type { McpContext } from "../context.js";

const NOTES_DESCRIPTION =
  "Notes are stored as HTML from the app's rich text editor. Plain text or simple HTML (<p>, <ul>, <li>, <strong>) is fine.";

export function registerTaskTools(server: McpServer, { user, notifier }: McpContext) {
  const notifyContext = { notifier, user: { id: user.id, name: user.name } };

  const taskNotFound = (taskId: string) => toolError(`Task "${taskId}" not found.`);
  const listNotFound = (listId: string) =>
    toolError(`List "${listId}" not found. Use get_lists to find valid list IDs.`);

  server.registerTool(
    "get_tasks",
    {
      title: "Get tasks",
      description:
        "Get the tasks in a list, in the user's display order. Completed tasks are excluded unless " +
        "includeCompleted is true. Smart lists return matching tasks from all of the user's lists.",
      inputSchema: z.object({
        listId: listIdSchema,
        includeCompleted: z.boolean().optional().describe("Also return completed tasks (default false).")
      }),
      outputSchema: z.object({
        list: z.object({ id: z.string(), title: z.string(), type: z.string() }),
        tasks: z.array(taskSummarySchema),
        completedTasks: z.array(taskSummarySchema).describe("Only populated when includeCompleted is true"),
        completedTaskCount: z.number()
      }),
      annotations: { readOnlyHint: true, openWorldHint: false }
    },
    async ({ listId: rawListId, includeCompleted = false }) => {
      if (isCustomList(rawListId)) {
        const list = await getCustomListById(rawListId, includeCompleted, { user });
        if (!list) return listNotFound(rawListId);
        return toolResult({
          list: { id: list.id, title: list.title, type: "smart" },
          tasks: list.tasks.map(toTaskSummary),
          completedTasks: list.completedTasks.map(toTaskSummary),
          completedTaskCount: includeCompleted ? list.completedTasks.length : list.additionalTasks
        });
      }

      const listId = await resolveListId(user.id, rawListId);
      const list = await getListById({ userId: user.id, listId, includeCompleted });
      if (!list) return listNotFound(rawListId);

      const summarize = (task: (typeof list.tasks)[number]) => toTaskSummary({ ...task, listId: list.id });
      return toolResult({
        list: { id: list.id, title: list.title, type: list.type },
        tasks: list.tasks.map(summarize),
        completedTasks: list.completedTasks.map(summarize),
        completedTaskCount: includeCompleted ? list.completedTasks.length : list.additionalTasks
      });
    }
  );

  server.registerTool(
    "get_task",
    {
      title: "Get task details",
      description: `Get the full details of a task, including notes and who created it. ${NOTES_DESCRIPTION}`,
      inputSchema: z.object({ taskId: taskIdSchema }),
      outputSchema: taskDetailSchema,
      annotations: { readOnlyHint: true, openWorldHint: false }
    },
    async ({ taskId }) => {
      const task = await getTaskDetailById(taskId);
      if (!task) return taskNotFound(taskId);

      // getListById doubles as the membership check: non-members get null.
      const list = await getListById({ userId: user.id, listId: task.listId });
      if (!list) return taskNotFound(taskId);

      const { createdBy } = task;
      return toolResult({
        ...toTaskSummary(task),
        notes: task.notes,
        createdAt: toIsoString(task.creationDate),
        updatedAt: toIsoString(task.updatedAt),
        createdBy: createdBy
          ? {
              id: createdBy.id,
              name: `${createdBy.firstName} ${createdBy.lastName}`.trim(),
              email: createdBy.email ?? null
            }
          : null,
        list: { id: list.id, title: list.title }
      });
    }
  );

  server.registerTool(
    "create_task",
    {
      title: "Create task",
      description:
        "Create a task at the top of a list (defaults to the inbox). Creating in a smart list puts the task " +
        `in the inbox with that list's defaults, e.g. "today" sets the due date to today. ${NOTES_DESCRIPTION}`,
      inputSchema: z.object({
        title: taskTitleSchema,
        listId: listIdSchema.optional(),
        dueDate: calendarDateSchema.optional(),
        priority: prioritySchema.optional(),
        notes: z.string().optional()
      }),
      outputSchema: taskSummarySchema,
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false }
    },
    async ({ title, listId: rawListId = "inbox", dueDate, priority, notes }) => {
      let target: string = rawListId;
      let smartListDefaults: Partial<typeof tasks.$inferInsert> = {};
      if (isCustomList(rawListId)) {
        smartListDefaults = modifyTaskForCustomList(rawListId, {}, { user });
        target = "inbox";
      }

      const listId = await resolveListId(user.id, target);
      if (!(await isUserAuthorizedToAccessList({ userId: user.id, listId }))) {
        return listNotFound(rawListId);
      }

      const task = await createTaskWithNotification(
        {
          ...smartListDefaults,
          // Explicit arguments win over smart list defaults.
          ...(dueDate !== undefined && { dueDate: calendarDateToDueDate(dueDate) }),
          ...(priority !== undefined && { priority }),
          ...(notes !== undefined && { notes }),
          title,
          listId,
          createdById: user.id
        },
        notifyContext
      );
      return toolResult(toTaskSummary(task));
    }
  );

  server.registerTool(
    "update_task",
    {
      title: "Update task",
      description:
        "Update a task. Only the provided fields change. Mark a task done with isCompleted: true, which " +
        "hides it from the default list view. Set dueDate or notes to null to clear them. Pass listId to " +
        `move the task to another list. ${NOTES_DESCRIPTION}`,
      inputSchema: z.object({
        taskId: taskIdSchema,
        title: taskTitleSchema.optional(),
        isCompleted: z.boolean().optional(),
        priority: prioritySchema.optional(),
        dueDate: calendarDateSchema.nullable().optional(),
        notes: z.string().nullable().optional(),
        listId: writableListIdSchema.optional().describe("Move the task to this list.")
      }),
      outputSchema: taskSummarySchema,
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false }
    },
    async ({ taskId, dueDate, listId: rawListId, ...fields }) => {
      const task = await getTaskById(taskId);
      if (!task || !(await isUserAuthorizedToAccessList({ userId: user.id, listId: task.listId }))) {
        return taskNotFound(taskId);
      }

      const updates: Partial<typeof tasks.$inferInsert> = {};
      if (fields.title !== undefined) updates.title = fields.title;
      if (fields.isCompleted !== undefined) updates.isCompleted = fields.isCompleted;
      if (fields.priority !== undefined) updates.priority = fields.priority;
      if (fields.notes !== undefined) updates.notes = fields.notes;
      if (dueDate !== undefined) updates.dueDate = dueDate === null ? null : calendarDateToDueDate(dueDate);

      if (rawListId !== undefined) {
        const listId = await resolveListId(user.id, rawListId);
        if (!(await isUserAuthorizedToAccessList({ userId: user.id, listId }))) {
          return listNotFound(rawListId);
        }
        updates.listId = listId;
      }

      if (Object.keys(updates).length === 0) {
        return toolError("Provide at least one field to update.");
      }

      const updated = await updateTaskWithNotification(taskId, updates, notifyContext);
      return toolResult(toTaskSummary(updated));
    }
  );

  server.registerTool(
    "reorder_tasks",
    {
      title: "Reorder tasks",
      description:
        "Set the order of the incomplete tasks in a list. Pass the IDs of ALL incomplete tasks in the list " +
        "(from get_tasks) in the desired order. Completed tasks are not ordered and must not be included. " +
        "Smart lists cannot be reordered; their order follows each task's own list.",
      inputSchema: z.object({
        listId: listIdSchema,
        taskIds: z.array(taskIdSchema).describe("Every incomplete task ID in the list, in the new order.")
      }),
      outputSchema: z.object({
        list: z.object({ id: z.string(), title: z.string(), type: z.string() }),
        tasks: z.array(taskSummarySchema)
      }),
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false }
    },
    async ({ listId: rawListId, taskIds }) => {
      if (isCustomList(rawListId)) {
        return toolError(
          `"${rawListId}" is a smart list and cannot be reordered. Its order follows each task's own list; ` +
            "reorder those lists instead."
        );
      }

      const listId = await resolveListId(user.id, rawListId);
      const list = await getListById({ userId: user.id, listId });
      if (!list) return listNotFound(rawListId);

      const current = list.tasks.map(task => task.id);
      const missing = current.filter(id => !taskIds.includes(id));
      const unknown = taskIds.filter(id => !current.includes(id));
      const duplicates = [...new Set(taskIds.filter((id, index) => taskIds.indexOf(id) !== index))];
      if (missing.length || unknown.length || duplicates.length) {
        return toolError(
          [
            "taskIds must contain every incomplete task in the list exactly once. Call get_tasks for the current list.",
            missing.length ? `Missing: ${missing.join(", ")}.` : "",
            unknown.length ? `Not an incomplete task in this list: ${unknown.join(", ")}.` : "",
            duplicates.length ? `Duplicated: ${duplicates.join(", ")}.` : ""
          ]
            .filter(Boolean)
            .join(" ")
        );
      }

      await reorderTasks(listId, taskIds);

      const updated = await getListById({ userId: user.id, listId });
      if (!updated) throw new Error("List disappeared during reorder");
      return toolResult({
        list: { id: updated.id, title: updated.title, type: updated.type },
        tasks: updated.tasks.map(task => toTaskSummary({ ...task, listId: updated.id }))
      });
    }
  );
}
