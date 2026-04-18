import { and, desc, eq, inArray } from "drizzle-orm";
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
      createdById: lists.createdById,
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
      createdById: lists.createdById,
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
    owner: result.createdById,
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

export async function updateListMembers(listId: string, memberIds: string[]) {
  // Get the list to check ownership
  const list = await db.query.lists.findFirst({
    where: eq(lists.id, listId)
  });

  if (!list) {
    throw new Error("List not found");
  }

  // Owner must always remain a member
  if (!memberIds.includes(list.createdById)) {
    throw new Error("Cannot remove the owner from the list");
  }

  // Get current members
  const currentMembers = await db.query.listMembers.findMany({
    where: eq(listMembers.listId, listId)
  });
  const currentMemberIds = currentMembers.map(m => m.userId);

  // Diff: who to add, who to remove
  const toAdd = memberIds.filter(id => !currentMemberIds.includes(id));
  const toRemove = currentMemberIds.filter(id => !memberIds.includes(id));

  if (toAdd.length > 0) {
    await db.insert(listMembers).values(
      toAdd.map(userId => ({ listId, userId }))
    );
  }

  if (toRemove.length > 0) {
    for (const userId of toRemove) {
      await db
        .delete(listMembers)
        .where(and(eq(listMembers.listId, listId), eq(listMembers.userId, userId)));
    }
  }
}

export async function deleteList(listId: string) {
  // Delete member entries first (no CASCADE on list_member FK)
  await db.delete(listMembers).where(eq(listMembers.listId, listId));
  // Delete tasks associated with this list
  await db.delete(tasks).where(eq(tasks.listId, listId));
  // Delete the list itself
  const [deleted] = await db.delete(lists).where(eq(lists.id, listId)).returning();
  return deleted;
}

export async function getListMembers(listId: string) {
  const members = await db.query.listMembers.findMany({
    where: eq(listMembers.listId, listId),
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
  });

  return members.map(member => ({
    id: member.user.id,
    email: member.user.email,
    profilePicture: member.user.image,
    firstName: member.user.name.split(" ")[0],
    lastName: member.user.name.split(" ").slice(1).join(" ")
  }));
}
