/**
 * Backfill script: recover orphaned tasks from DELETED v1 lists.
 *
 * Context
 * -------
 * The main v1 -> v2 migration (see migrate-v1.ts) intentionally SKIPS any task
 * whose `list` ObjectId does not resolve to a migrated list, logging
 * "Skipping task ...: list <id> not found". In v1, deleting a list was a hard
 * delete of ONLY the list document (see api/src/controllers/lists.ts:deleteList)
 * that never removed the list's tasks. Every task in a deleted list therefore
 * survives in Mongo as an ORPHAN: the task doc still points at a `list`
 * ObjectId that no longer exists in the `lists` collection.
 *
 * Those orphans were invisible in v1 (task reads always go through the parent
 * list) but they represent REAL activity the user did. Dropping them makes a
 * user's historical task stats under-count. This script recovers them into v2
 * so they are counted, while keeping the original list attribution where we can
 * guess it.
 *
 * Modes
 * -----
 *   analyze  (default) — READ ONLY. Connects to Mongo, finds orphaned tasks,
 *            groups them by their (now missing) list ObjectId, and prints each
 *            group's task count, completed/incomplete split, date range and
 *            titles. Use this to label what each deleted list probably was.
 *
 *   template — writes a RICH labeling file (an array of
 *            { id, name, numTasks, doneTasks, dateRange, exampleTasks }) so you
 *            can fill in `name` for each deleted list you want to recover.
 *
 *   export-map — converts a rich labeling file into the LIGHT `{ id: title }`
 *            map that the backfill actually consumes. Only labeled entries are
 *            included (blank / "__skip__" names are dropped). This is the tiny
 *            file you paste onto the server.
 *
 *   backfill — WRITES to Postgres. Reads a LIGHT `{ id: title }` map via
 *            --names and, for every orphaned deleted list whose id is in the
 *            map, recreates it (merging same-title lists per user) and inserts
 *            its tasks, preserving isCompleted and backfilling completedAt from
 *            creationDate (matching migrate-v1.ts). Orphans whose id is NOT in
 *            the map are skipped. Requires --confirm to actually write.
 *
 * Server workflow (prod)
 * ----------------------
 *   1. Locally, label lists and export the light map:
 *        yarn backfill:deleted-lists --mode=template --out=./labels.json
 *        # edit labels.json, fill in names
 *        yarn backfill:deleted-lists --mode=export-map --names=./labels.json \
 *            --out=./deleted-list-names.map.json
 *   2. Copy the light map onto the server (e.g. /tmp/deleted-list-names.map.json).
 *   3. On the server, dry-run then confirm:
 *        DATABASE_URL=... MONGO_URL=... tsx src/scripts/backfill-deleted-lists.ts \
 *            --mode=backfill --names=/tmp/deleted-list-names.map.json
 *        DATABASE_URL=... MONGO_URL=... tsx src/scripts/backfill-deleted-lists.ts \
 *            --mode=backfill --names=/tmp/deleted-list-names.map.json --confirm
 *
 * Environment: DATABASE_URL, MONGO_URL (defaults to mongodb://0.0.0.0/betterdo)
 */

import "dotenv/config";
import { readFileSync, writeFileSync } from "fs";
import { MongoClient, type Document } from "mongodb";
import { drizzle } from "drizzle-orm/node-postgres";
import { sql } from "drizzle-orm";
import { randomUUID } from "crypto";
import randomColor from "randomcolor";
import { lists } from "../schema/list.js";
import { tasks } from "../schema/task.js";

// Match the app's list color picker (app/src/components/ColorPicker), which
// uses `randomcolor` with a dark luminosity so recovered lists look like every
// other user-created list instead of the default grey #666666.
function prettyColor(): string {
  return randomColor({ luminosity: "dark" });
}

// ---------------------------------------------------------------------------
// Config / CLI args
// ---------------------------------------------------------------------------

const MONGO_URL = process.env.MONGO_URL || "mongodb://0.0.0.0/betterdo";
const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error("DATABASE_URL environment variable is required");
  process.exit(1);
}

function getArg(name: string): string | undefined {
  const prefix = `--${name}=`;
  const hit = process.argv.find(a => a.startsWith(prefix));
  return hit ? hit.slice(prefix.length) : undefined;
}
function hasFlag(name: string): boolean {
  return process.argv.includes(`--${name}`);
}

const MODE = (getArg("mode") || "analyze") as "analyze" | "backfill" | "template" | "export-map";
const OUT_FILE = getArg("out") || "./deleted-list-names.json";
const EMAIL_FILTER = getArg("email")?.toLowerCase();
const NAMES_FILE = getArg("names");
const CONFIRM = hasFlag("confirm");
// Only show/recover groups with at least this many tasks (noise reduction).
const MIN_GROUP = Number(getArg("min") || "1");

// ---------------------------------------------------------------------------
// Mongo document shapes (subset of v1 schemas)
// ---------------------------------------------------------------------------

interface MongoUser extends Document {
  _id: { toString(): string };
  email?: string;
  firstName?: string;
  lastName?: string;
}

interface MongoTask extends Document {
  _id: { toString(): string };
  title: string;
  list: { toString(): string };
  createdBy: { toString(): string };
  isCompleted?: boolean;
  dueDate?: Date;
  notes?: string;
  priority?: "low" | "normal" | "high";
  creationDate?: Date;
  subtasks?: Array<{ _id?: { toString(): string }; title: string; isComplete?: boolean }>;
}

interface V2Subtask {
  id: string;
  title: string;
  isComplete: boolean;
}

function transformSubtasks(subtasks: MongoTask["subtasks"]): V2Subtask[] | null {
  if (!subtasks || subtasks.length === 0) return null;
  const out = subtasks
    .filter(st => st && typeof st.title === "string" && st.title.length > 0)
    .map(st => ({
      id: st._id ? st._id.toString() : randomUUID(),
      title: st.title,
      isComplete: st.isComplete ?? false
    }));
  return out.length ? out : null;
}

// A group of orphan tasks that all belonged to the same (deleted) v1 list.
interface OrphanGroup {
  missingListId: string;
  tasks: MongoTask[];
}

// Everything we recover for one user.
interface UserOrphans {
  mongoUserId: string;
  email: string;
  name: string;
  groups: OrphanGroup[];
}

// ---------------------------------------------------------------------------
// Analysis (shared by both modes) — pure Mongo reads
// ---------------------------------------------------------------------------

async function collectOrphans(mongoDb: ReturnType<MongoClient["db"]>): Promise<UserOrphans[]> {
  const usersCol = mongoDb.collection<MongoUser>("users");
  const listsCol = mongoDb.collection("lists");
  const tasksCol = mongoDb.collection<MongoTask>("tasks");

  // 1. Surviving list ids (source of truth for "does the list still exist").
  const survivingListIds = new Set<string>();
  for await (const l of listsCol.find({}, { projection: { _id: 1 } })) {
    survivingListIds.add(l._id.toString());
  }
  console.log(`Surviving lists in Mongo: ${survivingListIds.size}`);

  // 2. Users, keyed by Mongo id, so we can attribute orphans and filter by email.
  const userById = new Map<string, MongoUser>();
  for await (const u of usersCol.find({}) as AsyncIterable<MongoUser>) {
    userById.set(u._id.toString(), u);
  }

  // 3. Scan tasks; an orphan is a task whose `list` is not a surviving list.
  //    Group orphans by (user -> missing list id).
  const perUser = new Map<string, Map<string, MongoTask[]>>();
  let scanned = 0;
  let orphanCount = 0;
  for await (const t of tasksCol.find({})) {
    scanned++;
    const listId = t.list?.toString();
    if (!listId || survivingListIds.has(listId)) continue; // not an orphan

    const creatorId = t.createdBy?.toString();
    if (!creatorId) continue; // cannot attribute; skip

    const creator = userById.get(creatorId);
    // Per the agreed policy: skip orphans whose creator was not migratable
    // (no email) — they have no v2 user to attribute the tasks to anyway.
    if (!creator || !creator.email || creator.email.trim() === "") continue;

    if (EMAIL_FILTER && creator.email.toLowerCase() !== EMAIL_FILTER) continue;

    let byList = perUser.get(creatorId);
    if (!byList) {
      byList = new Map<string, MongoTask[]>();
      perUser.set(creatorId, byList);
    }
    let arr = byList.get(listId);
    if (!arr) {
      arr = [];
      byList.set(listId, arr);
    }
    arr.push(t);
    orphanCount++;
  }
  console.log(`Scanned ${scanned} tasks; found ${orphanCount} orphaned tasks (creator has email).`);

  // 4. Shape into UserOrphans[].
  const result: UserOrphans[] = [];
  for (const [mongoUserId, byList] of perUser) {
    const creator = userById.get(mongoUserId)!;
    const groups: OrphanGroup[] = [];
    for (const [missingListId, groupTasks] of byList) {
      if (groupTasks.length < MIN_GROUP) continue;
      groups.push({ missingListId, tasks: groupTasks });
    }
    if (groups.length === 0) continue;
    // Biggest groups first — easiest to label.
    groups.sort((a, b) => b.tasks.length - a.tasks.length);
    result.push({
      mongoUserId,
      email: creator.email!,
      name: [creator.firstName, creator.lastName].filter(Boolean).join(" ") || "Unknown",
      groups
    });
  }
  return result;
}

// ---------------------------------------------------------------------------
// analyze mode — print grouped orphans for labeling
// ---------------------------------------------------------------------------

function fmtDate(d?: Date): string {
  return d ? new Date(d).toISOString().slice(0, 10) : "????-??-??";
}

function printAnalysis(users: UserOrphans[]): void {
  if (users.length === 0) {
    console.log("\nNo orphaned tasks found (for the given filter).");
    return;
  }
  for (const u of users) {
    const totalOrphans = u.groups.reduce((n, g) => n + g.tasks.length, 0);
    console.log(`\n=======================================================================`);
    console.log(`USER: ${u.name} <${u.email}>  (mongo _id ${u.mongoUserId})`);
    console.log(`  ${u.groups.length} deleted list(s), ${totalOrphans} orphaned task(s)`);
    console.log(`=======================================================================`);

    u.groups.forEach((g, i) => {
      const completed = g.tasks.filter(t => t.isCompleted).length;
      const dates = g.tasks
        .map(t => t.creationDate)
        .filter((d): d is Date => !!d)
        .sort((a, b) => +a - +b);
      const min = dates[0];
      const max = dates[dates.length - 1];
      console.log(
        `\n  [${i + 1}] deleted list ${g.missingListId}  ` +
          `— ${g.tasks.length} tasks (${completed} completed / ${g.tasks.length - completed} open), ` +
          `${fmtDate(min)} .. ${fmtDate(max)}`
      );
      // Show up to 40 titles so themes are recognizable.
      const titles = g.tasks.map(t => t.title);
      const shown = titles.slice(0, 40);
      for (const title of shown) {
        console.log(`        - ${title}`);
      }
      if (titles.length > shown.length) {
        console.log(`        … and ${titles.length - shown.length} more`);
      }
    });
  }

  console.log(`\n-----------------------------------------------------------------------`);
  console.log(`To name these lists, create a JSON file mapping missing list id -> name:`);
  console.log(`  { "<missingListId>": "Groceries", "<missingListId>": "Wedding" }`);
  console.log(`Then run with --mode=backfill --names=./that-file.json --confirm`);
  console.log(`Tip: run --mode=template --out=./names.json to generate a pre-filled file.`);
}

// ---------------------------------------------------------------------------
// template mode — write a pre-filled JSON names file for easy labeling.
// Each entry's value is "" (which the backfill treats as skip) so unlabeled
// lists are excluded by default; a trailing "//" note gives context. Because
// The template is a flat array of one object per deleted list. Fill in `name`
// (leave "" to skip a junk/test list). The other fields are read-only context.
// ---------------------------------------------------------------------------

interface TemplateEntry {
  id: string; // missing (deleted) v1 list ObjectId
  name: string; // <-- YOU fill this in; "" skips the list
  numTasks: number;
  doneTasks: number;
  dateRange: string; // "YYYY-MM-DD..YYYY-MM-DD"
  exampleTasks: string[]; // up to 10 sample titles
}

function buildTemplate(users: UserOrphans[]): TemplateEntry[] {
  const entries: TemplateEntry[] = [];
  for (const u of users) {
    for (const g of u.groups) {
      const doneTasks = g.tasks.filter(t => t.isCompleted).length;
      const dates = g.tasks
        .map(t => t.creationDate)
        .filter((d): d is Date => !!d)
        .sort((a, b) => +a - +b);
      entries.push({
        id: g.missingListId,
        name: "",
        numTasks: g.tasks.length,
        doneTasks,
        dateRange: `${fmtDate(dates[0])}..${fmtDate(dates[dates.length - 1])}`,
        exampleTasks: g.tasks.slice(0, 10).map(t => t.title)
      });
    }
  }
  return entries;
}

// ---------------------------------------------------------------------------
// backfill mode — write recovered lists + tasks into Postgres
// ---------------------------------------------------------------------------

async function runBackfill(users: UserOrphans[]): Promise<void> {
  const pg = drizzle(DATABASE_URL!);

  // The backfill consumes a LIGHT `{ <mongoListId>: "Title" }` map (produced by
  // --mode=export-map). Only deleted lists whose id appears here are recovered;
  // everything else is skipped. A rich labeling array is still accepted for
  // convenience, but the light map is the expected/canonical input.
  if (!NAMES_FILE) {
    console.error("--names=<deleted-list-names.map.json> is required. Generate it locally with --mode=export-map.");
    process.exit(1);
  }
  let nameMap: Record<string, string> = {};
  const parsed = JSON.parse(readFileSync(NAMES_FILE, "utf8"));
  if (Array.isArray(parsed)) {
    for (const e of parsed as TemplateEntry[]) {
      if (e && typeof e.id === "string") nameMap[e.id] = e.name ?? "";
    }
  } else {
    nameMap = parsed;
  }
  console.log(`Loaded ${Object.keys(nameMap).length} list name(s) from ${NAMES_FILE}`);

  // Does the v2 `list` table have a soft-delete column yet? If so, mark
  // recovered lists as deleted so they stay hidden from the live app while
  // still counting in per-user stats. If not, fall back to inserting them
  // normally (a later change may introduce the column).
  const colRows = await pg.execute<{ column_name: string }>(sql`
    SELECT column_name FROM information_schema.columns
    WHERE table_name = 'list' AND column_name = 'deleted_at'
  `);
  const hasSoftDelete = colRows.rows.length > 0;
  console.log(`list.deleted_at column present: ${hasSoftDelete}`);

  // Resolve each user's v2 id by email (main migration used random ids, so we
  // join on email, which v2 guarantees to be unique/non-null).
  let listsCreated = 0;
  let tasksInserted = 0;
  let listsSkipped = 0;

  for (const u of users) {
    const v2UserRows = await pg.execute<{ id: string }>(sql`
      SELECT id FROM "user" WHERE lower(email) = ${u.email.toLowerCase()} LIMIT 1
    `);
    const v2UserId = v2UserRows.rows[0]?.id;
    if (!v2UserId) {
      console.warn(`  Skipping ${u.email}: no v2 user found by email`);
      continue;
    }

    // Merge same-named deleted lists into a single recovered list (per user).
    // These are only merged with each OTHER (other deleted lists sharing the
    // name) — never with an already-migrated surviving list. Matching is
    // case-insensitive + trimmed; the first-seen spelling is used for display.
    const merged = new Map<string, { displayName: string; tasks: MongoTask[] }>();
    for (const g of u.groups) {
      const mapped = nameMap[g.missingListId];
      // A deleted list is recovered only if its id is present in the map with a
      // real title. Absent ids (not labeled) and the "__skip__"/"" sentinels are
      // excluded — e.g. junk/test lists we don't want to recover.
      if (mapped == null || mapped === "__skip__" || mapped.trim() === "") {
        listsSkipped++;
        continue;
      }
      const displayName = mapped.trim();
      const key = displayName.toLowerCase();
      const existing = merged.get(key);
      if (existing) {
        existing.tasks.push(...g.tasks);
      } else {
        merged.set(key, { displayName, tasks: [...g.tasks] });
      }
    }

    for (const { displayName, tasks: groupTasks } of merged.values()) {
      const listName = displayName || "Recovered (deleted list)";
      const newListId = randomUUID();

      if (!CONFIRM) {
        listsCreated++;
        console.log(`  [dry-run] would create list "${listName}" for ${u.email} with ${groupTasks.length} tasks`);
      } else {
        await pg.insert(lists).values({
          id: newListId,
          title: listName.slice(0, 255),
          type: "default",
          color: prettyColor(),
          createdById: v2UserId,
          createdAt: new Date(),
          updatedAt: new Date()
        });
        if (hasSoftDelete) {
          await pg.execute(sql`UPDATE "list" SET deleted_at = now() WHERE id = ${newListId}`);
        }
        listsCreated++;
      }

      // Insert the orphan tasks, ordered by creationDate.
      const ordered = [...groupTasks].sort(
        (a, b) => +(a.creationDate ?? new Date(0)) - +(b.creationDate ?? new Date(0))
      );
      ordered.forEach((t, position) => {
        const isCompleted = t.isCompleted ?? false;
        const creationDate = t.creationDate ?? new Date();
        if (!CONFIRM) {
          tasksInserted++;
          return;
        }
        // fire-and-collect; awaited below
        pendingInserts.push(
          pg.insert(tasks).values({
            id: randomUUID(),
            title: t.title.slice(0, 100),
            listId: newListId,
            createdById: v2UserId,
            isCompleted,
            completedAt: isCompleted ? creationDate : null,
            dueDate: t.dueDate ?? null,
            notes: t.notes ?? null,
            subtasks: transformSubtasks(t.subtasks),
            priority: t.priority ?? "normal",
            position,
            createdAt: creationDate,
            updatedAt: creationDate
          })
        );
        tasksInserted++;
      });
      // flush per merged list to bound memory
      if (CONFIRM && pendingInserts.length) {
        await Promise.all(pendingInserts);
        pendingInserts.length = 0;
      }
    }
  }

  console.log(
    CONFIRM
      ? `\nBackfill complete: created ${listsCreated} lists, inserted ${tasksInserted} tasks ` +
          `(${listsSkipped} lists skipped).`
      : `\nDry run: would create ${listsCreated} lists, insert ${tasksInserted} tasks ` +
          `(${listsSkipped} lists skipped). Re-run with --confirm to write.`
  );
}

const pendingInserts: Promise<unknown>[] = [];

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log(`Mode: ${MODE}${EMAIL_FILTER ? `  (email filter: ${EMAIL_FILTER})` : ""}`);

  // export-map is a pure file transform (rich labels -> light { id: title }
  // map). It needs no database/Mongo connection.
  if (MODE === "export-map") {
    if (!NAMES_FILE) {
      console.error("--names=<rich-labels.json> is required for export-map");
      process.exit(1);
    }
    const parsed = JSON.parse(readFileSync(NAMES_FILE, "utf8"));
    if (!Array.isArray(parsed)) {
      console.error(`${NAMES_FILE} is not a rich labeling array. Generate one with --mode=template.`);
      process.exit(1);
    }
    const map: Record<string, string> = {};
    for (const e of parsed as TemplateEntry[]) {
      const name = (e?.name ?? "").trim();
      if (!e?.id || name === "" || name === "__skip__") continue; // drop blanks/skips
      map[e.id] = name;
    }
    writeFileSync(OUT_FILE, JSON.stringify(map, null, 2) + "\n");
    console.log(
      `\nWrote light map with ${Object.keys(map).length} labeled list(s) to ${OUT_FILE}.\n` +
        `Copy this file to the server and run:\n` +
        `  tsx src/scripts/backfill-deleted-lists.ts --mode=backfill --names=<path> --confirm`
    );
    return;
  }

  console.log("Connecting to MongoDB...");
  const mongo = new MongoClient(MONGO_URL);
  await mongo.connect();
  const mongoDb = mongo.db();

  try {
    const users = await collectOrphans(mongoDb);

    if (MODE === "analyze") {
      printAnalysis(users);
    } else if (MODE === "template") {
      const entries = buildTemplate(users);
      writeFileSync(OUT_FILE, JSON.stringify(entries, null, 2));
      console.log(
        `\nWrote template with ${entries.length} list(s) to ${OUT_FILE}.\n` +
          `Fill in each "name" (leave "" to skip a junk/test list), then export the\n` +
          `light { id: title } map the backfill consumes:\n` +
          `  yarn backfill:deleted-lists --mode=export-map --names=${OUT_FILE} ` +
          `--out=./deleted-list-names.map.json`
      );
    } else if (MODE === "backfill") {
      await runBackfill(users);
    } else {
      console.error(`Unknown mode: ${MODE}`);
      process.exit(1);
    }
  } finally {
    await mongo.close();
  }
}

main()
  .then(() => process.exit(0))
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
