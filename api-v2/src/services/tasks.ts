import { eq } from "drizzle-orm";
import { db } from "../db.js";
import { tasks } from "../schema/task.js";

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
