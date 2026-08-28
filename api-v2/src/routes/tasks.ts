import { Hono } from "hono";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import {
  createTaskWithNotification,
  deleteTaskWithNotification,
  getTaskById,
  updateTaskWithNotification
} from "../services/tasks.js";
import { getNotifier } from "../notifier.js";
import { createTaskSchema, updateTaskSchema } from "../validators/tasks.js";
import { zValidator } from "@hono/zod-validator";
import { getUserInbox, isUserAuthorizedToAccessList } from "../services/lists.js";
import { isCustomList, modifyTaskForCustomList } from "../services/customLists.js";
import { timezone } from "../utils/timezone.js";
import { startOfDay } from "date-fns";
import type { tasks } from "../schema/task.js";
import z from "zod";

const tasksApi = new Hono();

tasksApi.get("/:id", authMiddleware, async c => {
  const taskId = c.req.param("id");
  const task = await getTaskById(taskId);
  if (!task) {
    return c.json({ error: "Task not found" }, 404);
  }
  if (
    !(await isUserAuthorizedToAccessList({
      userId: c.get("user").id,
      listId: task.listId
    }))
  ) {
    return c.json({ error: "Unauthorized access to this task" }, 403);
  }
  return c.json({
    ...task
  });
});

tasksApi.put(
  "/",
  authMiddleware,
  zValidator("json", createTaskSchema, (result, c) => {
    if (!result.success) {
      return c.json({
        error: "Invalid request data",
        result: z.prettifyError(result.error)
      });
    }
  }),
  async c => {
    const user = c.get("user");
    const payload = c.req.valid("json");
    const { listId: rawListId, dueDate, ...taskData } = payload;
    let resolvedListId = rawListId;
    let extraFields: Record<string, unknown> = {};

    // Normalize a client-supplied dueDate to the user's timezone at start of day,
    // matching v1 (controllers/tasks.ts:35). This is applied before the custom-list
    // path so that a custom list's own dueDate (today/tomorrow) takes precedence.
    const normalizedFields: Record<string, unknown> = {};
    if (dueDate && typeof dueDate === "string") {
      normalizedFields.dueDate = startOfDay(timezone(new Date(dueDate), user.timeZone));
    }

    // Handle custom list IDs (e.g. "inbox", "today", "highPriority", "tomorrow")
    if (isCustomList(resolvedListId)) {
      extraFields = modifyTaskForCustomList(resolvedListId, {}, { user });
      resolvedListId = "inbox";
    }

    // Resolve "inbox" to the user's actual inbox list UUID
    if (resolvedListId === "inbox") {
      const inbox = await getUserInbox(user.id);
      if (!inbox) {
        return c.json({ error: "Inbox not found" }, 404);
      }
      resolvedListId = inbox.id;
    }

    const newTask = await createTaskWithNotification(
      {
        ...taskData,
        ...normalizedFields,
        ...extraFields,
        listId: resolvedListId,
        createdById: user.id
      },
      { notifier: getNotifier(), user: { id: user.id, name: user.name } }
    );
    return c.json(newTask);
  }
);

tasksApi.post(
  "/:taskId",
  authMiddleware,
  zValidator("json", updateTaskSchema, (result, c) => {
    if (!result.success) {
      return c.json(
        {
          error: "Invalid request data",
          formattedMessage: z.prettifyError(result.error)
        },
        400
      );
    }
  }),
  async c => {
    const user = c.get("user");
    const payload = c.req.valid("json");
    const task = await getTaskById(c.req.param("taskId"));
    if (!task) {
      return c.json({ error: "Task not found" }, 404);
    }
    const isAuthorized = await isUserAuthorizedToAccessList({
      userId: user.id,
      listId: task.listId
    });
    if (!isAuthorized) {
      return c.json({ error: "Unauthorized access to this task" }, 403);
    }

    const { dueDate, ...rest } = payload;
    const updates: Partial<typeof tasks.$inferInsert> = { ...rest };
    // Convert a client-supplied dueDate to the user's timezone, matching v1
    // (controllers/tasks.ts:111). Explicit null clears the dueDate.
    if (dueDate === null) {
      updates.dueDate = null;
    } else if (dueDate && typeof dueDate === "string") {
      updates.dueDate = timezone(new Date(dueDate), user.timeZone);
    }

    const newTask = await updateTaskWithNotification(c.req.param("taskId"), updates, {
      notifier: getNotifier(),
      user: { id: user.id, name: user.name }
    });
    return c.json(newTask);
  }
);

tasksApi.delete("/:id", authMiddleware, async c => {
  const user = c.get("user");
  const taskId = c.req.param("id");
  const task = await getTaskById(taskId);
  if (!task) {
    return c.json({ error: "Task not found" }, 404);
  }
  if (
    !(await isUserAuthorizedToAccessList({
      userId: user.id,
      listId: task.listId
    }))
  ) {
    return c.json({ error: "Unauthorized access to this task" }, 403);
  }
  const result = await deleteTaskWithNotification(taskId, {
    notifier: getNotifier(),
    user: { id: user.id, name: user.name }
  });
  return c.json(result);
});

export default tasksApi;
