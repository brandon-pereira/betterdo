import { eq } from "drizzle-orm";
import { db } from "../db.js";
import { tasks } from "../schema/task.js";
import { notifyAboutSharedList } from "../helpers/notify.js";
import { getListById } from "./lists.js";
import type { Notifier } from "../notifier.js";

export function getTasks({ listId }: { listId: string }) {
  return db.query.tasks.findMany({
    where: eq(tasks.listId, listId)
  });
}

export function updateTask(taskId: string, updates: Partial<typeof tasks.$inferInsert>) {
  return db.update(tasks).set(updates).where(eq(tasks.id, taskId)).returning();
}

export function createTask(payload: typeof tasks.$inferInsert) {
  return db.insert(tasks).values(payload).returning();
}

export function getTaskById(taskId: string) {
  return db.query.tasks.findFirst({
    where: eq(tasks.id, taskId)
  });
}

export function deleteTask(taskId: string) {
  return db.delete(tasks).where(eq(tasks.id, taskId)).returning();
}

// Notification-aware versions that mirror v1 controller behavior

interface NotifyContext {
  notifier: Notifier;
  user: { id: string; name: string };
}

export async function createTaskWithNotification(
  payload: typeof tasks.$inferInsert,
  context: NotifyContext
) {
  const [task] = await createTask(payload);
  const list = await getListById({ userId: context.user.id, listId: payload.listId });
  if (list) {
    notifyAboutSharedList(
      `${context.user.name} added ${task.title} to ${list.title}.`,
      list,
      context
    );
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
      notificationSent = true;
      notifyAboutSharedList(
        `${context.user.name} completed ${existingTask.title} in ${list.title}.`,
        list,
        context
      );
    }
  }

  const [updatedTask] = await updateTask(taskId, updates);

  // Notify about shared list update (if not already notified about completion)
  if (!notificationSent) {
    notifyAboutSharedList(
      `${context.user.name} updated ${updatedTask.title} in ${list.title}.`,
      list,
      context
    );
  }

  return updatedTask;
}

export async function deleteTaskWithNotification(
  taskId: string,
  context: NotifyContext
) {
  const existingTask = await getTaskById(taskId);
  if (!existingTask) throw new Error("Invalid Task ID");

  const list = await getListById({ userId: context.user.id, listId: existingTask.listId });
  if (!list) throw new Error("User is not authorized to access task");

  const [deletedTask] = await deleteTask(taskId);

  notifyAboutSharedList(
    `${context.user.name} deleted ${deletedTask.title} from ${list.title}.`,
    list,
    context
  );

  return { success: true };
}
