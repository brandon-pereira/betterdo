import { and, count, eq } from "drizzle-orm";
import { db } from "../db.js";
import { tasks } from "../schema/task.js";
import { notifyAboutSharedList } from "../helpers/notify.js";
import { getListById } from "./lists.js";
import type { Notifier } from "../notifier.js";

export function getTasks({ listId }: { listId: string }) {
  return db.query.tasks.findMany({
    where: { listId }
  });
}

export function updateTask(taskId: string, updates: Partial<typeof tasks.$inferInsert>) {
  return db.update(tasks).set(updates).where(eq(tasks.id, taskId)).returning();
}

export async function createTask(payload: typeof tasks.$inferInsert) {
  // Auto-assign next position within the list
  const [{ value: taskCount }] = await db
    .select({ value: count() })
    .from(tasks)
    .where(eq(tasks.listId, payload.listId));

  return db
    .insert(tasks)
    .values({ ...payload, position: taskCount })
    .returning();
}

export async function reorderTasks(listId: string, taskIds: string[]) {
  // Get all current task IDs for the list
  const currentTasks = await db.query.tasks.findMany({
    where: { listId },
    columns: { id: true }
  });
  const currentTaskIds = currentTasks.map(t => t.id);

  // Validate: same length and same IDs (no injection or removal)
  if (taskIds.length !== currentTaskIds.length || taskIds.some(id => !currentTaskIds.includes(id))) {
    throw new Error("Invalid modification of tasks");
  }

  // Update positions
  for (let i = 0; i < taskIds.length; i++) {
    await db
      .update(tasks)
      .set({ position: i })
      .where(and(eq(tasks.id, taskIds[i]), eq(tasks.listId, listId)));
  }
}

export function getTaskById(taskId: string) {
  return db.query.tasks.findFirst({
    where: { id: taskId }
  });
}

// Populated detail view of a task, matching the shape the app expects
// (createdBy as a user profile object, creationDate instead of createdAt).
// Mirrors the custom-lists task shape so the Edit Task modal's CreatorBlock
// renders consistently.
export async function getTaskDetailById(taskId: string) {
  const task = await db.query.tasks.findFirst({
    where: { id: taskId },
    with: {
      createdBy: {
        columns: { id: true, email: true, name: true, image: true }
      }
    }
  });

  if (!task) {
    return undefined;
  }

  const { createdAt, createdBy, ...rest } = task;
  const name = createdBy?.name ?? "";

  return {
    ...rest,
    creationDate: createdAt,
    createdBy: createdBy
      ? {
          id: createdBy.id,
          email: createdBy.email ?? undefined,
          firstName: name.split(" ")[0] ?? "",
          lastName: name.split(" ").slice(1).join(" "),
          profilePicture: createdBy.image ?? undefined
        }
      : undefined
  };
}

function deleteTask(taskId: string) {
  return db.delete(tasks).where(eq(tasks.id, taskId)).returning();
}

// Notification-aware versions that mirror v1 controller behavior

interface NotifyContext {
  notifier: Notifier;
  user: { id: string; name: string };
}

export async function createTaskWithNotification(payload: typeof tasks.$inferInsert, context: NotifyContext) {
  const [task] = await createTask(payload);
  const list = await getListById({ userId: context.user.id, listId: payload.listId });
  if (list) {
    notifyAboutSharedList(`${context.user.name} added ${task.title} to ${list.title}.`, list, context);
  }
  return task;
}

export async function updateTaskWithNotification(
  taskId: string,
  updates: Partial<typeof tasks.$inferInsert>,
  context: NotifyContext
) {
  const existingTask = await getTaskById(taskId);
  if (!existingTask) throw new Error("Invalid Task ID");

  const list = await getListById({ userId: context.user.id, listId: existingTask.listId });
  if (!list) throw new Error("User is not authorized to access task");

  let notificationSent = false;

  // If the task isCompleted state changed
  if (updates.isCompleted !== undefined && existingTask.isCompleted !== updates.isCompleted) {
    if (updates.isCompleted) {
      // Stamp completion time when transitioning incomplete -> complete
      updates.completedAt = new Date();
      notificationSent = true;
      notifyAboutSharedList(`${context.user.name} completed ${existingTask.title} in ${list.title}.`, list, context);
    } else {
      // Clear completion time when re-opening a task
      updates.completedAt = null;
    }
  }

  const [updatedTask] = await updateTask(taskId, updates);

  // Notify about shared list update (if not already notified about completion)
  if (!notificationSent) {
    notifyAboutSharedList(`${context.user.name} updated ${updatedTask.title} in ${list.title}.`, list, context);
  }

  return updatedTask;
}

export async function deleteTaskWithNotification(taskId: string, context: NotifyContext) {
  const existingTask = await getTaskById(taskId);
  if (!existingTask) throw new Error("Invalid Task ID");

  const list = await getListById({ userId: context.user.id, listId: existingTask.listId });
  if (!list) throw new Error("User is not authorized to access task");

  const [deletedTask] = await deleteTask(taskId);

  notifyAboutSharedList(`${context.user.name} deleted ${deletedTask.title} from ${list.title}.`, list, context);

  return { success: true };
}
