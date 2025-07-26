import { and, eq } from "drizzle-orm";
import { db } from "../db.js";
import { listMembers, lists } from "../schema/list.js";
import { tasks } from "../schema/task.js";

export function getLists({ userId }: { userId: string }) {
  return db
    .select({
      id: lists.id,
      title: lists.title,
      type: lists.type,
      color: lists.color,
      createdAt: lists.createdAt,
      updatedAt: lists.updatedAt,
      listMembers: listMembers
    })
    .from(lists)
    .innerJoin(listMembers, and(eq(listMembers.userId, userId), eq(listMembers.listId, lists.id)));
}

export async function getListById({ userId, listId }: { userId: string; listId: string }) {
  const [result] = await db
    .select({
      id: lists.id,
      title: lists.title,
      type: lists.type,
      color: lists.color,
      createdAt: lists.createdAt,
      updatedAt: lists.updatedAt,
      listMembers: listMembers
    })
    .from(lists)
    .limit(1)
    .where(and(eq(lists.id, listId)))
    .innerJoin(listMembers, and(eq(listMembers.userId, userId), eq(listMembers.listId, lists.id)));

  return result;
}

export async function createList(payload: typeof lists.$inferInsert) {
  const newList = await db.insert(lists).values(payload).returning();
  await db.insert(listMembers).values({
    listId: newList[0].id,
    userId: payload.createdById
  });
  return newList[0];
}

export async function createInboxForUser(userId: string) {
  await createList({
    createdById: userId,
    title: "Inbox",
    type: "inbox"
  });
}
