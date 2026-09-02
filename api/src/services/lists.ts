import { and, asc, count, eq, inArray } from "drizzle-orm";
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
    .innerJoin(listMembers, and(eq(listMembers.listId, lists.id), eq(listMembers.userId, userId)))
    .orderBy(asc(listMembers.position));

  if (result.length === 0) {
    return [];
  }

  const listIds = result.map(list => list.id);

  // Fetch incomplete tasks and completed-task counts for all lists in one pass
  const [incompleteTasks, completedCounts] = await Promise.all([
    db
      .select({
        id: tasks.id,
        title: tasks.title,
        listId: tasks.listId,
        isCompleted: tasks.isCompleted,
        priority: tasks.priority
      })
      .from(tasks)
      .where(and(inArray(tasks.listId, listIds), eq(tasks.isCompleted, false)))
      .orderBy(asc(tasks.position)),
    db
      .select({
        listId: tasks.listId,
        value: count()
      })
      .from(tasks)
      .where(and(inArray(tasks.listId, listIds), eq(tasks.isCompleted, true)))
      .groupBy(tasks.listId)
  ]);

  const tasksByList = new Map<string, typeof incompleteTasks>();
  for (const task of incompleteTasks) {
    const existing = tasksByList.get(task.listId);
    if (existing) {
      existing.push(task);
    } else {
      tasksByList.set(task.listId, [task]);
    }
  }

  const completedCountByList = new Map<string, number>();
  for (const row of completedCounts) {
    completedCountByList.set(row.listId, row.value);
  }

  return result.map(list => ({
    ...list,
    tasks: tasksByList.get(list.id) ?? [],
    completedTasks: [],
    additionalTasks: completedCountByList.get(list.id) ?? 0
  }));
}

export async function getListById({
  userId,
  listId,
  includeCompleted = false
}: {
  userId: string;
  listId: string;
  includeCompleted?: boolean;
}) {
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
      where: { listId: result.id },
      orderBy: { position: "asc" },
      columns: {
        id: true,
        title: true,
        isCompleted: true,
        priority: true
      }
    }),
    db.query.listMembers.findMany({
      where: { listId: result.id },
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

  // Split completed tasks out of the main `tasks` array (matches v1 behavior)
  const activeTasks = _tasks.filter(task => !task.isCompleted);
  const completedTasks = _tasks.filter(task => task.isCompleted);

  return {
    ...result,
    owner: result.createdById,
    tasks: activeTasks,
    // Completed tasks are only hydrated when explicitly requested; otherwise
    // the count is surfaced via `additionalTasks`.
    completedTasks: includeCompleted ? completedTasks : [],
    additionalTasks: includeCompleted ? 0 : completedTasks.length,
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

export async function createList(payload: typeof lists.$inferInsert & { createdById: string }) {
  const newList = await db.insert(lists).values(payload).returning();

  // Get the current max position for this user's lists
  const [{ value: listCount }] = await db
    .select({ value: count() })
    .from(listMembers)
    .where(eq(listMembers.userId, payload.createdById));

  await db.insert(listMembers).values({
    listId: newList[0].id,
    userId: payload.createdById,
    position: listCount
  });
  return newList[0];
}

export async function isUserAuthorizedToAccessList({ userId, listId }: { userId: string; listId: string }) {
  const result = await db.query.listMembers.findFirst({
    where: { userId, listId }
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
  if (result) return result;

  // Self-heal: if the post-signup hook failed to create the inbox, create it
  // lazily on first access instead of leaving the user in a broken state.
  const inbox = await createList({ createdById: userId, title: "Inbox", type: "inbox" });
  return { id: inbox.id };
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
    where: { id: listId }
  });

  if (!list) {
    throw new Error("List not found");
  }

  // Owner must always remain a member (skip if the list has been orphaned by
  // owner deletion — createdById is null in that case).
  if (list.createdById && !memberIds.includes(list.createdById)) {
    throw new Error("Cannot remove the owner from the list");
  }

  // Get current members
  const currentMembers = await db.query.listMembers.findMany({
    where: { listId }
  });
  const currentMemberIds = currentMembers.map(m => m.userId);

  // Diff: who to add, who to remove
  const toAdd = memberIds.filter(id => !currentMemberIds.includes(id));
  const toRemove = currentMemberIds.filter(id => !memberIds.includes(id));

  if (toAdd.length > 0) {
    await db.insert(listMembers).values(toAdd.map(userId => ({ listId, userId })));
  }

  if (toRemove.length > 0) {
    for (const userId of toRemove) {
      await db.delete(listMembers).where(and(eq(listMembers.listId, listId), eq(listMembers.userId, userId)));
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
    where: { listId },
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
