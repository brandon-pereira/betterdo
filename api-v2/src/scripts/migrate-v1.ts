/**
 * Migration script: v1 (MongoDB) -> v2 (PostgreSQL)
 *
 * Migrates all users, lists, tasks, and push subscriptions from
 * the legacy MongoDB database to the new PostgreSQL database.
 *
 * Usage:
 *   yarn workspace api-v2 migrate:v1
 *
 * Requirements:
 *   - Both MongoDB and PostgreSQL must be running (docker compose up)
 *   - The PostgreSQL schema must already be pushed (yarn migrate)
 *   - Environment variables: DATABASE_URL, MONGO_URL (optional, defaults to mongodb://0.0.0.0/betterdo)
 */

import "dotenv/config";
import { MongoClient, type Document } from "mongodb";
import { drizzle } from "drizzle-orm/node-postgres";
import { randomUUID } from "crypto";
import { createHash } from "crypto";
import { user, account } from "../schema/auth.js";
import { pushSubscriptions } from "../schema/notification.js";
import { lists, listMembers } from "../schema/list.js";
import { tasks } from "../schema/task.js";

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const MONGO_URL = process.env.MONGO_URL || "mongodb://0.0.0.0/betterdo";
const DATABASE_URL = process.env.DATABASE_URL;

// Must match better-auth's built-in Google provider `accountIssuer`
// (@better-auth/core social-providers/google). This is the value written into
// account.issuer on a normal Google sign-in and is part of the
// (issuer, accountId) unique key better-auth uses to find existing accounts.
const GOOGLE_ISSUER = "https://accounts.google.com";

if (!DATABASE_URL) {
  console.error("DATABASE_URL environment variable is required");
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getGravatarUrl(email: string | undefined | null): string | undefined {
  if (!email || typeof email !== "string") return undefined;
  const normalized = email.toLowerCase().trim();
  const hash = createHash("sha256").update(normalized).digest("hex");
  return `https://www.gravatar.com/avatar/${hash}?s=256&d=retro`;
}

function generateId(): string {
  return randomUUID().replace(/-/g, "").slice(0, 21);
}

// v2 subtask shape (see validators/tasks.ts): { id, title, isComplete }.
// v1 stores subtasks as Mongo subdocuments { _id, title, isComplete }, so we
// remap `_id` -> `id` (as a string) and drop the ObjectId, which would not
// serialize cleanly into the jsonb column.
interface MongoSubtask {
  _id?: { toString(): string };
  title: string;
  isComplete?: boolean;
}

interface V2Subtask {
  id: string;
  title: string;
  isComplete: boolean;
}

function transformSubtasks(subtasks: MongoSubtask[] | undefined | null): V2Subtask[] | null {
  if (!subtasks || subtasks.length === 0) return null;
  return subtasks
    .filter(st => st && typeof st.title === "string" && st.title.length > 0)
    .map(st => ({
      id: st._id ? st._id.toString() : generateId(),
      title: st.title,
      isComplete: st.isComplete ?? false
    }));
}

// ---------------------------------------------------------------------------
// MongoDB document interfaces (matching v1 schemas)
// ---------------------------------------------------------------------------

interface MongoUser extends Document {
  _id: { toString(): string };
  google_id?: string;
  firstName: string;
  lastName?: string;
  email: string;
  profilePicture?: string;
  creationDate?: Date;
  lastLogin?: Date;
  timeZone?: string;
  isBeta?: boolean;
  isPushEnabled?: boolean;
  customLists?: {
    highPriority?: boolean;
    today?: boolean;
    tomorrow?: boolean;
    overdue?: boolean;
    week?: boolean;
  };
  lists?: Array<{ toString(): string }>;
  pushSubscriptions?: string[];
}

interface MongoList extends Document {
  _id: { toString(): string };
  title: string;
  owner: { toString(): string };
  members?: Array<{ toString(): string }>;
  type?: string;
  color?: string;
  tasks?: Array<{ toString(): string }>;
  completedTasks?: Array<{ toString(): string }>;
}

interface MongoTask extends Document {
  _id: { toString(): string };
  title: string;
  list: { toString(): string };
  createdBy: { toString(): string };
  isCompleted?: boolean;
  dueDate?: Date;
  notes?: string;
  // v1 subtasks are subdocuments: { _id: ObjectId, title, isComplete }
  subtasks?: Array<{ _id?: { toString(): string }; title: string; isComplete?: boolean }>;
  priority?: "low" | "normal" | "high";
  creationDate?: Date;
}

// ---------------------------------------------------------------------------
// Migration
// ---------------------------------------------------------------------------

async function migrate() {
  console.log("Connecting to MongoDB...");
  const mongo = new MongoClient(MONGO_URL);
  await mongo.connect();
  const mongoDb = mongo.db();

  console.log("Connecting to PostgreSQL...");
  const pg = drizzle(DATABASE_URL!);

  // ID mappings: MongoDB ObjectId string -> new PostgreSQL ID
  const userIdMap = new Map<string, string>();
  const listIdMap = new Map<string, string>();

  // -----------------------------------------------------------------------
  // 1. Migrate Users
  // -----------------------------------------------------------------------
  console.log("\n--- Migrating Users ---");
  const mongoUsers = (await mongoDb.collection("users").find().toArray()) as unknown as MongoUser[];
  console.log(`Found ${mongoUsers.length} users in MongoDB`);

  let usersCreated = 0;
  let usersSkipped = 0;
  let accountsCreated = 0;

  for (const mongoUser of mongoUsers) {
    const mongoId = mongoUser._id.toString();

    // v2 requires a non-null, unique email. A small number of legacy v1 users
    // never completed onboarding and have no email. They cannot be represented
    // in v2, so skip them. They are intentionally NOT added to userIdMap, which
    // makes the list/task passes skip anything that references them.
    if (!mongoUser.email || typeof mongoUser.email !== "string" || mongoUser.email.trim() === "") {
      console.warn(`  Skipping user ${mongoId} ("${mongoUser.firstName ?? ""}"): missing email`);
      usersSkipped++;
      continue;
    }

    const newId = generateId();
    userIdMap.set(mongoId, newId);

    const name = [mongoUser.firstName, mongoUser.lastName].filter(Boolean).join(" ");

    await pg.insert(user).values({
      id: newId,
      name: name || "Unknown",
      email: mongoUser.email,
      emailVerified: true, // existing users verified via Google OAuth
      image: mongoUser.profilePicture || getGravatarUrl(mongoUser.email) || null,
      createdAt: mongoUser.creationDate ?? new Date(),
      updatedAt: mongoUser.lastLogin ?? new Date(),
      timeZone: mongoUser.timeZone || "America/New_York",
      customLists: mongoUser.customLists ?? {
        highPriority: true,
        today: true,
        tomorrow: false,
        overdue: false,
        week: false
      },
      isBeta: mongoUser.isBeta ?? false,
      isPushEnabled: mongoUser.isPushEnabled ?? false
    });
    usersCreated++;

    // Create an account record for Google OAuth users.
    //
    // better-auth (>=1.7) keys OAuth accounts by (issuer, accountId), where the
    // issuer for Google is the provider's declared OIDC issuer and the accountId
    // is the Google `sub` claim (stored as `google_id` in v1). These MUST match
    // what better-auth writes on a normal Google sign-in, otherwise the account
    // lookup fails and a duplicate account/user would be created on next login.
    // See @better-auth/core social-providers/google: accountIssuer =
    // "https://accounts.google.com", accountSubject = profile.sub.
    if (mongoUser.google_id) {
      await pg.insert(account).values({
        id: generateId(),
        issuer: GOOGLE_ISSUER,
        accountId: mongoUser.google_id,
        providerId: "google",
        userId: newId,
        createdAt: mongoUser.creationDate ?? new Date(),
        updatedAt: mongoUser.lastLogin ?? new Date()
      });
      accountsCreated++;
    }

    // Migrate push subscriptions to the new table
    if (mongoUser.pushSubscriptions && mongoUser.pushSubscriptions.length > 0) {
      for (const endpoint of mongoUser.pushSubscriptions) {
        await pg.insert(pushSubscriptions).values({
          id: generateId(),
          userId: newId,
          endpoint,
          createdAt: mongoUser.creationDate ?? new Date()
        });
      }
      console.log(`  Migrated ${mongoUser.pushSubscriptions.length} push subscriptions for ${mongoUser.email}`);
    }
  }

  console.log(`Created ${usersCreated} users (${usersSkipped} skipped), ${accountsCreated} accounts`);

  // -----------------------------------------------------------------------
  // 2. Migrate Lists
  // -----------------------------------------------------------------------
  console.log("\n--- Migrating Lists ---");
  const mongoLists = (await mongoDb.collection("lists").find().toArray()) as unknown as MongoList[];
  console.log(`Found ${mongoLists.length} lists in MongoDB`);

  let listsCreated = 0;
  let membershipsCreated = 0;

  // Build the per-user list ordering exactly as v1 renders it (see the v1 API's
  // getLists controller: `[inbox, ...customLists, ...userLists]`). v1 orders a
  // user's own lists by their `user.lists[]` array (new lists are pushed to the
  // back) and always shows the inbox first. We therefore rank each Mongo list id
  // per user so `list_member.position` reproduces that order in v2, which sorts
  // lists by `position asc`.
  const userListRank = new Map<string, Map<string, number>>();
  for (const mongoUser of mongoUsers) {
    const mongoUserId = mongoUser._id.toString();
    if (!userIdMap.has(mongoUserId)) continue; // skipped user (no email)

    const rank = new Map<string, number>();
    let nextRank = 0;
    // Inbox always first. Find this user's inbox among the lists they own.
    const inboxList = mongoLists.find(l => l.type === "inbox" && l.owner.toString() === mongoUserId);
    if (inboxList) {
      rank.set(inboxList._id.toString(), nextRank++);
    }
    // Then the user's own lists in their stored array order.
    for (const listRef of mongoUser.lists ?? []) {
      const lid = listRef.toString();
      if (!rank.has(lid)) rank.set(lid, nextRank++);
    }
    userListRank.set(mongoUserId, rank);
  }

  for (const mongoList of mongoLists) {
    const mongoId = mongoList._id.toString();
    const ownerId = mongoList.owner.toString();
    const newOwnerId = userIdMap.get(ownerId);

    if (!newOwnerId) {
      console.warn(`  Skipping list "${mongoList.title}" (${mongoId}): owner ${ownerId} not found`);
      continue;
    }

    // Map v1 types to v2 types (v2 only supports "inbox" | "default")
    const listType = mongoList.type === "inbox" ? ("inbox" as const) : ("default" as const);

    const newListId = randomUUID();
    listIdMap.set(mongoId, newListId);

    await pg.insert(lists).values({
      id: newListId,
      title: mongoList.title,
      type: listType,
      color: mongoList.color || "#666666",
      createdById: newOwnerId,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    listsCreated++;

    // Create list_member entries for all members, ordering each membership by
    // the member's own v1 list ordering (inbox first, then their lists[] order).
    // Any list a user is a member of but which is missing from their ordering
    // (an edge case) is appended after their ranked lists, preserving a stable
    // position.
    const members = mongoList.members ?? [mongoList.owner];
    for (const memberRef of members) {
      const memberId = memberRef.toString();
      const newMemberId = userIdMap.get(memberId);
      if (!newMemberId) {
        console.warn(`  Skipping member ${memberId} for list "${mongoList.title}": user not found`);
        continue;
      }

      const rank = userListRank.get(memberId);
      let position: number;
      if (rank && rank.has(mongoId)) {
        position = rank.get(mongoId)!;
      } else if (rank) {
        // Not in the member's ordering — append after their known lists.
        position = rank.size;
        rank.set(mongoId, position);
      } else {
        position = 0;
      }

      await pg.insert(listMembers).values({
        listId: newListId,
        userId: newMemberId,
        position
      });
      membershipsCreated++;
    }
  }

  console.log(`Created ${listsCreated} lists, ${membershipsCreated} memberships`);

  // -----------------------------------------------------------------------
  // 3. Migrate Tasks
  // -----------------------------------------------------------------------
  console.log("\n--- Migrating Tasks ---");
  const mongoTasks = (await mongoDb.collection("tasks").find().toArray()) as unknown as MongoTask[];
  console.log(`Found ${mongoTasks.length} tasks in MongoDB`);

  let tasksCreated = 0;
  let tasksSkipped = 0;
  let tasksOrphaned = 0;

  // Build a map of list -> ordered task IDs from the v1 list documents
  // so we can preserve the original task ordering via the position column.
  //
  // In v1, a list only displays tasks whose _id is present in its `tasks`
  // (incomplete) or `completedTasks` (completed) arrays — see the v1 API's
  // `populateList` in api/src/schemas/lists.ts. A task's own `list` field can
  // point at a list it is no longer a member of (e.g. it was removed from the
  // list array but the task doc was never deleted). Those orphaned tasks are
  // invisible in v1, so we must NOT migrate them, otherwise they would
  // resurface in v2 (which keys tasks off `list_id`). We therefore treat the
  // list arrays as the source of truth for task membership and ordering.
  const listTaskOrder = new Map<string, string[]>();
  for (const mongoList of mongoLists) {
    const mongoListId = mongoList._id.toString();
    const orderedIds: string[] = [];
    // Incomplete tasks come first (in their original order)
    if (mongoList.tasks) {
      for (const ref of mongoList.tasks) {
        orderedIds.push(ref.toString());
      }
    }
    // Completed tasks come after
    if (mongoList.completedTasks) {
      for (const ref of mongoList.completedTasks) {
        orderedIds.push(ref.toString());
      }
    }
    listTaskOrder.set(mongoListId, orderedIds);
  }

  for (const mongoTask of mongoTasks) {
    const mongoTaskId = mongoTask._id.toString();
    const mongoListId = mongoTask.list.toString();
    const mongoCreatedById = mongoTask.createdBy.toString();

    const newListId = listIdMap.get(mongoListId);
    const newCreatedById = userIdMap.get(mongoCreatedById);

    if (!newListId) {
      console.warn(`  Skipping task "${mongoTask.title}" (${mongoTaskId}): list ${mongoListId} not found`);
      tasksSkipped++;
      continue;
    }
    if (!newCreatedById) {
      console.warn(`  Skipping task "${mongoTask.title}" (${mongoTaskId}): creator ${mongoCreatedById} not found`);
      tasksSkipped++;
      continue;
    }

    // Determine position from the original list ordering. A position of -1
    // means the task is not referenced by its list's tasks/completedTasks
    // arrays, i.e. it is orphaned and hidden in v1 — skip it to match v1.
    const orderList = listTaskOrder.get(mongoListId);
    const position = orderList ? orderList.indexOf(mongoTaskId) : -1;

    if (position < 0) {
      console.warn(
        `  Skipping task "${mongoTask.title}" (${mongoTaskId}): not referenced by list ${mongoListId} arrays (orphaned/hidden in v1)`
      );
      tasksOrphaned++;
      continue;
    }

    await pg.insert(tasks).values({
      id: randomUUID(),
      title: mongoTask.title,
      listId: newListId,
      createdById: newCreatedById,
      isCompleted: mongoTask.isCompleted ?? false,
      dueDate: mongoTask.dueDate ?? null,
      notes: mongoTask.notes ?? null,
      subtasks: transformSubtasks(mongoTask.subtasks),
      priority: mongoTask.priority ?? "normal",
      position,
      createdAt: mongoTask.creationDate ?? new Date(),
      updatedAt: mongoTask.creationDate ?? new Date()
    });
    tasksCreated++;
  }

  console.log(`Created ${tasksCreated} tasks (${tasksSkipped} skipped, ${tasksOrphaned} orphaned/hidden in v1)`);

  // -----------------------------------------------------------------------
  // Summary
  // -----------------------------------------------------------------------
  console.log("\n--- Migration Complete ---");
  console.log(`Users:         ${usersCreated} (${usersSkipped} skipped)`);
  console.log(`Accounts:      ${accountsCreated}`);
  console.log(`Lists:         ${listsCreated}`);
  console.log(`Memberships:   ${membershipsCreated}`);
  console.log(`Tasks:         ${tasksCreated} (${tasksSkipped} skipped, ${tasksOrphaned} orphaned/hidden in v1)`);

  await mongo.close();
  process.exit(0);
}

migrate().catch(err => {
  console.error("Migration failed:", err);
  process.exit(1);
});
