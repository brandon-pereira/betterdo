import { and, eq } from "drizzle-orm";
import { db } from "../db.js";
import { lists } from "../schema/list.js";

export function getLists({ userId }: { userId: string }) {
  return db.query.lists.findMany({
    where: eq(lists.createdById, userId)
  });
}

export function getListById({ userId, listId }: { userId: string; listId: string }) {
  return db.query.lists.findFirst({
    where: and(eq(lists.id, listId), eq(lists.createdById, userId)),
    with: {
      tasks: true
    }
  });
}

export async function createList(payload: typeof lists.$inferInsert) {
  const newList = await db.insert(lists).values(payload).returning();
  return newList[0];
}
