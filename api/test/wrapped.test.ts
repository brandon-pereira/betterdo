import { describe, test, expect, beforeAll } from "vitest";
import { eq } from "drizzle-orm";
import { testDb } from "./helpers/setup.js";
import createRouter, { type RouterOptions } from "./helpers/createRouter.js";
import { createList } from "../src/services/lists.js";
import { createTask, getTaskById, updateTaskWithNotification } from "../src/services/tasks.js";
import { getWrapped } from "../src/services/wrapped.js";
import { wrappedPeriodSchema } from "../src/validators/wrapped.js";
import { tasks } from "../src/schema/task.js";

const TZ = "America/Edmonton";
const YEAR_2025 = { year: 2025 };
const ALL_TIME = { all: true } as const;

let router: RouterOptions;
let listId: string;

// Insert a task with a specific createdAt (and optional completion) so we can
// exercise the year-scoped, timezone-aware aggregations deterministically.
async function seedTask(opts: { title: string; createdAt: Date; completed?: boolean; completedAt?: Date }) {
  const [task] = await createTask({ listId, title: opts.title, createdById: router.user.id });
  await testDb
    .update(tasks)
    .set({
      createdAt: opts.createdAt,
      isCompleted: opts.completed ?? false,
      completedAt: opts.completedAt ?? (opts.completed ? opts.createdAt : null)
    })
    .where(eq(tasks.id, task.id));
  return task;
}

describe("BetterDo Wrapped", () => {
  beforeAll(async () => {
    router = await createRouter();
    const list = await createList({ title: "Wrapped List", createdById: router.user.id });
    listId = list.id;

    // 2025 data. Times are UTC; America/Edmonton is UTC-6/-7 so these all land
    // on the intended local day.
    // 3x "journal" -> top recurring task
    await seedTask({ title: "Journal", createdAt: new Date("2025-01-10T18:00:00Z"), completed: true });
    await seedTask({ title: "journal", createdAt: new Date("2025-02-10T18:00:00Z"), completed: true });
    await seedTask({ title: " JOURNAL ", createdAt: new Date("2025-03-10T18:00:00Z"), completed: true });
    // 1x "milk", incomplete
    await seedTask({ title: "Milk", createdAt: new Date("2025-03-11T18:00:00Z"), completed: false });
    // A 3-day streak in June (28, 29, 30) with two tasks on the 29th (busiest day)
    await seedTask({ title: "a", createdAt: new Date("2025-06-28T18:00:00Z"), completed: true });
    await seedTask({ title: "b", createdAt: new Date("2025-06-29T18:00:00Z"), completed: true });
    await seedTask({ title: "c", createdAt: new Date("2025-06-29T19:00:00Z"), completed: true });
    await seedTask({ title: "d", createdAt: new Date("2025-06-30T18:00:00Z"), completed: true });

    // A single task in the previous year for growth calculation
    await seedTask({ title: "old", createdAt: new Date("2024-05-01T18:00:00Z"), completed: true });
  });

  test("computes yearly totals scoped to the requested year", async () => {
    const w = await getWrapped({ userId: router.user.id, period: YEAR_2025, timeZone: TZ });
    expect(w.year).toBe(2025);
    expect(w.periodType).toBe("year");
    expect(w.totals.created).toBe(8); // 8 tasks created in 2025
    expect(w.totals.completed).toBe(7); // milk is incomplete
    expect(w.totals.completionRate).toBe(88); // 7 of the 8 created in 2025
    expect(w.totals.createdPreviousPeriod).toBe(1);
    expect(w.totals.growthPct).toBe(700); // (8-1)/1 * 100
  });

  test("counts active days and excludes the previous year", async () => {
    const w = await getWrapped({ userId: router.user.id, period: YEAR_2025, timeZone: TZ });
    // Distinct local days: Jan10, Feb10, Mar10, Mar11, Jun28, Jun29, Jun30 = 7
    expect(w.totals.activeDays).toBe(7);
  });

  test("identifies the longest streak", async () => {
    const w = await getWrapped({ userId: router.user.id, period: YEAR_2025, timeZone: TZ });
    expect(w.longestStreak.added.length).toBe(3); // Jun 28-30
    expect(w.longestStreak.added.start).toBe("2025-06-28");
    expect(w.longestStreak.added.end).toBe("2025-06-30");
    // completed_at defaults to created_at for the seeded completed tasks, so the
    // completed streak matches the added streak here.
    expect(w.longestStreak.completed.length).toBe(3);
    expect(w.longestStreak.completed.start).toBe("2025-06-28");
  });

  test("identifies the busiest single day", async () => {
    const w = await getWrapped({ userId: router.user.id, period: YEAR_2025, timeZone: TZ });
    expect(w.busiestDay).toEqual({ date: "2025-06-29", count: 2 });
  });

  test("ranks most-created tasks by normalized title", async () => {
    const w = await getWrapped({ userId: router.user.id, period: YEAR_2025, timeZone: TZ });
    expect(w.topTasks[0]).toEqual({ title: "journal", count: 3 });
  });

  test("returns a 12-month completed breakdown", async () => {
    const w = await getWrapped({ userId: router.user.id, period: YEAR_2025, timeZone: TZ });
    expect(w.breakdown).toHaveLength(12);
    const june = w.breakdown.find(m => m.key === 6);
    expect(june?.label).toBe("Jun");
    expect(june?.created).toBe(4); // Jun 28, 29, 29, 30
    expect(june?.completed).toBe(4);
  });

  test("returns the first task of the requested year", async () => {
    const w = await getWrapped({ userId: router.user.id, period: YEAR_2025, timeZone: TZ });
    // Earliest task created in 2025 is the Jan 10 "Journal".
    expect(w.firstTask?.title).toBe("Journal");
  });

  test("all-time first task is the earliest ever", async () => {
    const w = await getWrapped({ userId: router.user.id, period: ALL_TIME, timeZone: TZ });
    expect(w.firstTask?.title).toBe("old"); // 2024-05-01, earlier than any 2025 task
  });

  test("supports all-time: totals span every year, growth is null", async () => {
    const w = await getWrapped({ userId: router.user.id, period: ALL_TIME, timeZone: TZ });
    expect(w.periodType).toBe("all-time");
    // All 9 seeded tasks (8 in 2025 + 1 in 2024).
    expect(w.totals.created).toBe(9);
    expect(w.totals.completed).toBe(8); // milk is incomplete
    expect(w.totals.growthPct).toBeNull();
    expect(w.totals.createdPreviousPeriod).toBe(0);
  });

  test("all-time breakdown is bucketed by year", async () => {
    const w = await getWrapped({ userId: router.user.id, period: ALL_TIME, timeZone: TZ });
    const y2024 = w.breakdown.find(b => b.key === 2024);
    const y2025 = w.breakdown.find(b => b.key === 2025);
    expect(y2024?.label).toBe("2024");
    expect(y2024?.created).toBe(1);
    expect(y2025?.created).toBe(8);
    // Range is contiguous from 2024 to the current year.
    expect(w.breakdown[0].key).toBe(2024);
    expect(w.breakdown[w.breakdown.length - 1].key).toBe(new Date().getFullYear());
  });

  test("all-time streak still finds the June run", async () => {
    const w = await getWrapped({ userId: router.user.id, period: ALL_TIME, timeZone: TZ });
    expect(w.longestStreak.added.length).toBe(3);
    expect(w.longestStreak.added.start).toBe("2025-06-28");
  });

  test("completed streak is based on completion date, independent of created", async () => {
    // Seed a fresh user with a task created on a lone day but completed as part of
    // a 2-day completion run, to prove the completed streak uses completed_at.
    const solo = await createRouter();
    const list = await createList({ title: "Solo", createdById: solo.user.id });
    const mk = async (created: string, completedAt: string) => {
      const [task] = await createTask({ listId: list.id, title: "x", createdById: solo.user.id });
      await testDb
        .update(tasks)
        .set({ createdAt: new Date(created), isCompleted: true, completedAt: new Date(completedAt) })
        .where(eq(tasks.id, task.id));
    };
    // Created far apart, but completed on consecutive days (Mar 3 & Mar 4).
    await mk("2025-01-01T18:00:00Z", "2025-03-03T18:00:00Z");
    await mk("2025-02-01T18:00:00Z", "2025-03-04T18:00:00Z");

    const w = await getWrapped({ userId: solo.user.id, period: YEAR_2025, timeZone: TZ });
    expect(w.longestStreak.added.length).toBe(1); // created days are far apart
    expect(w.longestStreak.completed.length).toBe(2); // completed Mar 3-4
    expect(w.longestStreak.completed.start).toBe("2025-03-03");
    expect(w.longestStreak.completed.end).toBe("2025-03-04");
  });

  test("monthly period buckets by day and compares with the previous month", async () => {
    const w = await getWrapped({
      userId: router.user.id,
      period: { year: 2025, month: 6 },
      timeZone: TZ
    });
    expect(w.periodType).toBe("month");
    expect(w.month).toBe(6);
    expect(w.totals.created).toBe(4); // Jun 28, 29, 29, 30
    expect(w.totals.daysInPeriod).toBe(30);
    expect(w.breakdown).toHaveLength(30);
    expect(w.breakdown.find(d => d.key === 29)).toEqual({ key: 29, label: "29", created: 2, completed: 2 });
    expect(w.totals.createdPreviousPeriod).toBe(0); // nothing in May 2025
    expect(w.totals.growthPct).toBeNull();
    expect(w.firstTask?.title).toBe("a");
  });

  test("completed counts tasks finished in the period, even if created earlier", async () => {
    const solo = await createRouter();
    const list = await createList({ title: "Carry over", createdById: solo.user.id });
    const [task] = await createTask({ listId: list.id, title: "x", createdById: solo.user.id });
    await testDb
      .update(tasks)
      .set({
        createdAt: new Date("2025-02-20T18:00:00Z"),
        isCompleted: true,
        completedAt: new Date("2025-03-05T18:00:00Z")
      })
      .where(eq(tasks.id, task.id));

    const march = await getWrapped({
      userId: solo.user.id,
      period: { year: 2025, month: 3 },
      timeZone: TZ
    });
    expect(march.totals.created).toBe(0);
    expect(march.totals.completed).toBe(1);
    expect(march.totals.completionRate).toBe(0);
  });

  test("monthly growth compares across a year boundary", async () => {
    const w = await getWrapped({
      userId: router.user.id,
      period: { year: 2025, month: 1 },
      timeZone: TZ
    });
    expect(w.breakdown).toHaveLength(31);
    expect(w.totals.created).toBe(1);
    expect(w.totals.createdPreviousPeriod).toBe(0); // December 2024 is empty
  });

  test("the current month only counts days elapsed so far", async () => {
    const now = new Date();
    const w = await getWrapped({
      userId: router.user.id,
      period: { month: now.getMonth() + 1 }, // year defaults to the current one
      timeZone: TZ
    });
    expect(w.totals.daysInPeriod).toBe(now.getDate());
  });

  test("validates the requested period", () => {
    expect(wrappedPeriodSchema.parse({ year: 2026, month: 10 })).toEqual({ year: 2026, month: 10 });
    expect(wrappedPeriodSchema.parse({ year: 2026 })).toEqual({ year: 2026 });
    expect(wrappedPeriodSchema.parse({ all: true })).toEqual({ all: true });
    expect(wrappedPeriodSchema.parse({})).toEqual({});
    expect(wrappedPeriodSchema.safeParse({ year: 2026, month: 13 }).success).toBe(false);
    expect(wrappedPeriodSchema.safeParse({ year: 1999 }).success).toBe(false);
    expect(wrappedPeriodSchema.safeParse({ year: "2026" }).success).toBe(false);
    expect(wrappedPeriodSchema.safeParse({ all: "true" }).success).toBe(false);
    expect(wrappedPeriodSchema.safeParse({ all: false }).success).toBe(false);
  });

  test("stamps completedAt when a task transitions to completed", async () => {
    const [task] = await createTask({ listId, title: "Finish me", createdById: router.user.id });
    expect((await getTaskById(task.id))?.completedAt).toBeNull();

    await updateTaskWithNotification(task.id, { isCompleted: true }, router);
    const completed = await getTaskById(task.id);
    expect(completed?.isCompleted).toBe(true);
    expect(completed?.completedAt).toBeInstanceOf(Date);
  });

  test("clears completedAt when a task is re-opened", async () => {
    const [task] = await createTask({ listId, title: "Reopen me", createdById: router.user.id });
    await updateTaskWithNotification(task.id, { isCompleted: true }, router);
    expect((await getTaskById(task.id))?.completedAt).toBeInstanceOf(Date);

    await updateTaskWithNotification(task.id, { isCompleted: false }, router);
    expect((await getTaskById(task.id))?.completedAt).toBeNull();
  });
});
