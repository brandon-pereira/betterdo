import { eq, and } from "drizzle-orm";
import { db } from "../db.js";
import { user, pushSubscriptions } from "../schema/auth.js";
import { listMembers, lists } from "../schema/list.js";
import type { Notifier } from "../notifier.js";

export interface SanitizedUser {
  id: string;
  firstName: string;
  lastName?: string;
  email: string;
  profilePicture: string | null;
}

export async function getUserByEmail(email: string): Promise<SanitizedUser | null> {
  const result = await db.query.user.findFirst({
    where: eq(user.email, email)
  });

  if (!result) {
    return null;
  }

  return {
    id: result.id,
    firstName: result.name.split(" ")[0],
    lastName: result.name.split(" ").slice(1).join(" ") || undefined,
    email: result.email,
    profilePicture: result.image
  };
}

interface UpdateUserProps {
  isPushEnabled?: boolean;
  pushSubscription?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  timeZone?: string;
  customLists?: Record<string, boolean>;
  lists?: string[];
}

interface UpdateUserContext {
  user: { id: string; name: string };
  notifier: Notifier;
}

export async function updateUser(props: UpdateUserProps, { user: sessionUser, notifier }: UpdateUserContext) {
  let didUpdatePushSubscription = false;

  // Handle adding a push subscription
  if (props.pushSubscription && typeof props.pushSubscription === "string") {
    // Check if subscription already exists
    const existing = await db.query.pushSubscriptions.findFirst({
      where: and(eq(pushSubscriptions.userId, sessionUser.id), eq(pushSubscriptions.endpoint, props.pushSubscription))
    });
    if (!existing) {
      didUpdatePushSubscription = true;
      await db.insert(pushSubscriptions).values({
        id: `ps_${Date.now()}_${Math.random().toString(36).slice(2)}`,
        userId: sessionUser.id,
        endpoint: props.pushSubscription
      });
    }
  }

  // Handle isPushEnabled toggle
  if (typeof props.isPushEnabled === "boolean") {
    const currentUser = await db.query.user.findFirst({
      where: eq(user.id, sessionUser.id)
    });
    if (currentUser && props.isPushEnabled !== currentUser.isPushEnabled) {
      didUpdatePushSubscription = true;
      await db.update(user).set({ isPushEnabled: props.isPushEnabled }).where(eq(user.id, sessionUser.id));
    }
  }

  // Handle list reordering
  if (props.lists) {
    if (!Array.isArray(props.lists)) {
      throw new Error("Invalid modification of lists");
    }

    // Get the user's current non-inbox lists
    const currentMembers = await db
      .select({ listId: listMembers.listId, type: lists.type })
      .from(listMembers)
      .innerJoin(lists, eq(lists.id, listMembers.listId))
      .where(and(eq(listMembers.userId, sessionUser.id), eq(lists.type, "default")));

    const currentListIds = currentMembers.map(m => m.listId);

    // Validate: same length and same IDs (no injection or removal)
    if (props.lists.length !== currentListIds.length || props.lists.some(id => !currentListIds.includes(id))) {
      throw new Error("Invalid modification of lists");
    }

    // Get the inbox position (inbox always stays at position 0)
    // Update non-inbox lists with new positions starting after inbox
    for (let i = 0; i < props.lists.length; i++) {
      await db
        .update(listMembers)
        .set({ position: i + 1 })
        .where(and(eq(listMembers.userId, sessionUser.id), eq(listMembers.listId, props.lists[i])));
    }
  }

  // Handle name updates
  const updates: Record<string, unknown> = {};
  if (props.firstName || props.lastName) {
    const currentUser = await db.query.user.findFirst({
      where: eq(user.id, sessionUser.id)
    });
    if (currentUser) {
      const firstName = props.firstName || currentUser.name.split(" ")[0];
      const lastName = props.lastName || currentUser.name.split(" ").slice(1).join(" ");
      updates.name = lastName ? `${firstName} ${lastName}` : firstName;
    }
  }
  if (props.email) updates.email = props.email;
  if (props.timeZone) updates.timeZone = props.timeZone;
  if (props.customLists) {
    const currentUser = await db.query.user.findFirst({
      where: eq(user.id, sessionUser.id)
    });
    const existingCustomLists = (currentUser?.customLists as Record<string, boolean>) ?? {};
    updates.customLists = { ...existingCustomLists, ...props.customLists };
  }

  if (Object.keys(updates).length > 0) {
    await db.update(user).set(updates).where(eq(user.id, sessionUser.id));
  }

  // Send push notification confirmation
  if (didUpdatePushSubscription) {
    await notifier.send(sessionUser.id, {
      title: "You're subscribed!",
      body: "We'll notify you with updates!"
    });
  }

  // Return the updated user
  const updatedUser = await db.query.user.findFirst({
    where: eq(user.id, sessionUser.id)
  });

  return updatedUser!;
}
