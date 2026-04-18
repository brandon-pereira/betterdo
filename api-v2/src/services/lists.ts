import { and, desc, eq } from "drizzle-orm";
import { db } from "../db.js";
import { listMembers, lists } from "../schema/list.js";
import { tasks } from "../schema/task.js";

export async function getUserLists({ userId }: { userId: string }) {
  const result = await db
    .select({
      id: lists.id,
      title: lists.title,
      type: lists.type,
      color: lists.color,
      createdAt: lists.createdAt,
      updatedAt: lists.updatedAt
    })
    .from(lists)
    .innerJoin(listMembers, and(eq(listMembers.listId, lists.id), eq(listMembers.userId, userId)));
  return result;
}

export async function getListById({ userId, listId }: { userId: string; listId: string }) {
  const [result] = await db
    .select({
      id: lists.id,
      title: lists.title,
      type: lists.type,
      color: lists.color,
      createdAt: lists.createdAt,
      updatedAt: lists.updatedAt
    })
    .from(lists)
    .limit(1)
    .where(and(eq(lists.id, listId)))
    .innerJoin(listMembers, and(eq(listMembers.userId, userId), eq(listMembers.listId, lists.id)));

  if (!result) {
    return null;
  }

  const [_tasks, members] = await Promise.all([
    db.query.tasks.findMany({
      where: eq(tasks.listId, result.id),
      orderBy: desc(tasks.createdAt),
      columns: {
        id: true,
        title: true,
        isCompleted: true,
        priority: true
      }
    }),
    db.query.listMembers.findMany({
      where: eq(listMembers.listId, result.id),
      columns: {},
      with: {
        user: {
          columns: {
            id: true,
            name: true,
            email: true,
            image: true
          }
        }
      }
    })
  ]);

  return {
    ...result,
    tasks: _tasks,
    members: members.map(member => {
      return {
        id: member.user.id,
        email: member.user.email,
        profilePicture: member.user.image,
        firstName: member.user.name.split(" ")[0],
        lastName: member.user.name.split(" ").slice(1).join(" ")
      };
    })
  };
}

export async function createList(payload: typeof lists.$inferInsert) {
  const newList = await db.insert(lists).values(payload).returning();
  await db.insert(listMembers).values({
    listId: newList[0].id,
    userId: payload.createdById
  });
  return newList[0];
}

export async function isUserAuthorizedToAccessList({ userId, listId }: { userId: string; listId: string }) {
  const result = await db.query.listMembers.findFirst({
    where: and(eq(listMembers.userId, userId), eq(listMembers.listId, listId))
  });
  return !!result;
}

export async function getUserInbox(userId: string) {
  const [result] = await db
    .select({ id: lists.id })
    .from(lists)
    .innerJoin(listMembers, and(eq(listMembers.listId, lists.id), eq(listMembers.userId, userId)))
    .where(eq(lists.type, "inbox"))
    .limit(1);
  return result ?? null;
}

export async function createInboxForUser(userId: string) {
  await createList({
    createdById: userId,
    title: "Inbox",
    type: "inbox"
  });
}
