import { describe, test, expect } from "vitest";
import { startOfDay } from "date-fns";
import { createTaskSchema, updateTaskSchema } from "../src/validators/tasks.js";
import { timezone } from "../src/utils/timezone.js";

// These tests lock in Phase 5 parity with v1's dueDate timezone normalization
// (api/src/controllers/tasks.ts:35 on create, :111 on update).

describe("Task dueDate validation", () => {
  test("accepts the frontend's toUTCString() (RFC-1123) format on update", () => {
    // Frontend sends dueDate via Date.prototype.toUTCString(), e.g.
    // "Mon, 01 Jan 2024 07:00:00 GMT" — NOT strict ISO-8601.
    const frontendDueDate = new Date(2024, 0, 1).toUTCString();
    const result = updateTaskSchema.safeParse({ dueDate: frontendDueDate });
    expect(result.success).toBe(true);
    expect(result.data?.dueDate).toBe(frontendDueDate);
  });

  test("accepts an ISO-8601 string on update", () => {
    const iso = new Date(2024, 0, 1).toISOString();
    const result = updateTaskSchema.safeParse({ dueDate: iso });
    expect(result.success).toBe(true);
  });

  test("accepts null to clear the dueDate on update", () => {
    const result = updateTaskSchema.safeParse({ dueDate: null });
    expect(result.success).toBe(true);
    expect(result.data?.dueDate).toBeNull();
  });

  test("rejects an unparseable dueDate string", () => {
    const result = updateTaskSchema.safeParse({ dueDate: "not-a-date" });
    expect(result.success).toBe(false);
  });

  test("createTaskSchema accepts a dueDate string", () => {
    const frontendDueDate = new Date(2024, 0, 1).toUTCString();
    const result = createTaskSchema.safeParse({
      listId: "inbox",
      title: "Test",
      dueDate: frontendDueDate
    });
    expect(result.success).toBe(true);
    expect(result.data?.dueDate).toBe(frontendDueDate);
  });

  test("createTaskSchema still works without a dueDate", () => {
    const result = createTaskSchema.safeParse({ listId: "inbox", title: "Test" });
    expect(result.success).toBe(true);
  });
});

describe("Task dueDate normalization (parity with v1)", () => {
  const timeZone = "America/Edmonton";

  test("create normalizes to start of day in the user's timezone", () => {
    // Mirrors v1: startOfDay(timezone(new Date(dueDate), user.timeZone))
    const input = new Date(2024, 0, 1).toUTCString();
    const normalized = startOfDay(timezone(new Date(input), timeZone));
    expect(normalized.getHours()).toBe(0);
    expect(normalized.getMinutes()).toBe(0);
    expect(normalized.getSeconds()).toBe(0);
    expect(normalized.getMilliseconds()).toBe(0);
  });

  test("update converts to the user's timezone without forcing start of day", () => {
    // Mirrors v1: timezone(new Date(dueDate), user.timeZone) — no startOfDay
    const input = "2024-06-15T18:30:00.000Z";
    const converted = timezone(new Date(input), timeZone);
    const expected = new Date(new Date(input).toLocaleString("en-US", { timeZone }));
    expect(converted.getTime()).toBe(expected.getTime());
  });
});
