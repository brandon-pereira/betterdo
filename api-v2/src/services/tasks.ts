import { eq } from "drizzle-orm";
import { db } from "../db.js";
import { tasks } from "../schema/task.js";

export function getTasks({ listId }: { listId: string }) {
  return db.query.tasks.findMany({
    where: eq(tasks.listId, listId)
  });
}
