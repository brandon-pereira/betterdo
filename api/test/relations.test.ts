import { describe, test, expect, beforeAll, afterAll } from "vitest";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { defineRelationsPart, type TablesRelationalConfig } from "drizzle-orm";
import { pushSchema } from "drizzle-kit/api-postgres";
import { relations, mergeRelationParts } from "../src/schema/relations.js";
import * as authSchema from "../src/schema/auth.js";
import * as listSchema from "../src/schema/list.js";
import * as notificationSchema from "../src/schema/notification.js";
import * as taskSchema from "../src/schema/task.js";

// These tests guard the `mergeRelationParts` helper in src/schema/relations.ts.
//
// The helper exists because the `user` table's relations are split across two
// `defineRelationsPart` fragments (the better-auth CLI generates one, we author
// the other) and a plain `{ ...a, ...b }` spread would drop one side. drizzle is
// on an rc release, so this is the exact surface that could silently break on a
// drizzle upgrade — hence the coverage here, including a runtime query.

// Build two real parts over the same schema that both declare `user`, so the
// merge is exercised against actual drizzle output (not a hand-rolled mock of
// drizzle's internal shape, which would drift on upgrade).
const schema = { ...authSchema, ...listSchema, ...notificationSchema };

const partOne = defineRelationsPart(schema, r => ({
  user: {
    sessions: r.many.session({ from: r.user.id, to: r.session.userId })
  },
  session: {
    user: r.one.user({ from: r.session.userId, to: r.user.id })
  }
})) as unknown as TablesRelationalConfig;

const partTwo = defineRelationsPart(schema, r => ({
  user: {
    pushSubscriptions: r.many.pushSubscriptions()
  },
  pushSubscriptions: {
    user: r.one.user({ from: r.pushSubscriptions.userId, to: r.user.id })
  }
})) as unknown as TablesRelationalConfig;

describe("mergeRelationParts", () => {
  test("merges per-table relations from overlapping parts (does not overwrite)", () => {
    const merged = mergeRelationParts(partOne, partTwo);

    // Overlapping `user` table keeps relations from BOTH parts
    expect(Object.keys(merged.user.relations).sort()).toEqual(["pushSubscriptions", "sessions"]);
    // Non-overlapping tables carry through untouched
    expect(Object.keys(merged.session.relations)).toEqual(["user"]);
    expect(Object.keys(merged.pushSubscriptions.relations)).toEqual(["user"]);
  });

  test("does not mutate the input parts", () => {
    const beforeOne = Object.keys(partOne.user.relations).sort();
    const beforeTwo = Object.keys(partTwo.user.relations).sort();

    mergeRelationParts(partOne, partTwo);

    expect(Object.keys(partOne.user.relations).sort()).toEqual(beforeOne);
    expect(Object.keys(partTwo.user.relations).sort()).toEqual(beforeTwo);
  });

  test("regression: a plain spread drops the overlapping table's relations", () => {
    // Documents WHY the helper is needed. If a future drizzle version changes
    // part shape so a spread is sufficient, this is the first thing to revisit.
    const spread = { ...partOne, ...partTwo } as TablesRelationalConfig;
    expect(Object.keys(spread.user.relations)).not.toContain("sessions");

    const merged = mergeRelationParts(partOne, partTwo);
    expect(Object.keys(merged.user.relations)).toContain("sessions");
    expect(Object.keys(merged.user.relations)).toContain("pushSubscriptions");
  });
});

describe("relations (exported, merged auth + app)", () => {
  const cfg = relations as unknown as TablesRelationalConfig;

  test("user table exposes both auth-side and app-side relations", () => {
    const userRelations = Object.keys(cfg.user.relations).sort();

    // Auth side (from generated authRelations)
    expect(userRelations).toContain("sessions");
    expect(userRelations).toContain("accounts");
    expect(userRelations).toContain("passkeys");
    // App side (from appRelations)
    expect(userRelations).toContain("pushSubscriptions");
    expect(userRelations).toContain("scheduledNotifications");
    expect(userRelations).toContain("lists");
  });

  test("all schema tables are present in the merged relations", () => {
    const expected = [
      "user",
      "session",
      "account",
      "passkey",
      "lists",
      "listMembers",
      "tasks",
      "pushSubscriptions",
      "scheduledNotifications"
    ];
    for (const tableName of expected) {
      expect(cfg[tableName], `missing table "${tableName}" in merged relations`).toBeDefined();
    }
  });
});

// Runtime check: the merged relations must actually drive relational queries.
// This is the strongest guard against a drizzle upgrade changing the internal
// shape/behavior — if the merge produced something drizzle can't consume, these
// `.with` queries throw ("Unknown relation ...").
describe("relations resolve at query time", () => {
  const client = new PGlite();
  const db = drizzle({ client, relations });

  beforeAll(async () => {
    // Create tables straight from the drizzle `pgTable` definitions instead of
    // hand-written DDL. drizzle-orm has no runtime DDL builder — that lives in
    // drizzle-kit (the CLI), whose programmatic `pushSchema` generates and
    // applies the CREATE TABLE statements from the schema.
    const schemaTables = { ...authSchema, ...listSchema, ...notificationSchema, ...taskSchema };
    const { apply } = await pushSchema(schemaTables, db);
    await apply();

    await db.insert(authSchema.user).values({ id: "u1", name: "Alice", email: "a@b.c" });
    await db.insert(authSchema.session).values({
      id: "s1",
      token: "tok",
      userId: "u1",
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
    });
    await db.insert(notificationSchema.pushSubscriptions).values({
      id: "p1",
      userId: "u1",
      endpoint: "https://push.example/1"
    });
    await db.insert(listSchema.lists).values({ title: "Inbox", createdById: "u1" });
  });

  afterAll(async () => {
    await client.close();
  });

  // Note: these use the fully typed `db.query` API (no casts). If the exported
  // `relations` type ever loses the auth-side or app-side keys, these stop
  // type-checking — which is the compile-time half of this guard.
  test("query user with an auth-side relation (sessions)", async () => {
    const result = await db.query.user.findFirst({ with: { sessions: true } });
    expect(result?.sessions).toHaveLength(1);
    expect(result?.sessions[0]?.id).toBe("s1");
  });

  test("query user with an app-side relation (pushSubscriptions)", async () => {
    const result = await db.query.user.findFirst({ with: { pushSubscriptions: true } });
    expect(result?.pushSubscriptions).toHaveLength(1);
    expect(result?.pushSubscriptions[0]?.endpoint).toBe("https://push.example/1");
  });

  test("query user with auth-side and app-side relations together", async () => {
    const result = await db.query.user.findFirst({
      with: { sessions: true, pushSubscriptions: true, lists: true }
    });
    expect(result?.sessions).toHaveLength(1);
    expect(result?.pushSubscriptions).toHaveLength(1);
    expect(result?.lists).toHaveLength(1);
    expect(result?.lists[0]?.title).toBe("Inbox");
  });

  test("query the inverse app-side relation (list -> createdBy user)", async () => {
    const list = await db.query.lists.findFirst({ with: { createdBy: true } });
    expect(list?.createdBy?.id).toBe("u1");
  });
});
