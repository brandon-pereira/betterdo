import { describe, test, expect, beforeAll } from "vitest";
import createRouter, { type RouterOptions } from "./helpers/createRouter.js";
import { createList } from "../src/services/lists.js";
import { createTask } from "../src/services/tasks.js";
import { getCustomListById, modifyTaskForCustomList } from "../src/services/customLists.js";

let router1: RouterOptions;
let router2: RouterOptions;
let validListId1: string;
let validListId2: string;

beforeAll(async () => {
  router1 = await createRouter();
  router2 = await createRouter();
  const validList1 = await createList({ title: "Valid List", createdById: router1.user.id });
  const validList2 = await createList({ title: "Valid List", createdById: router2.user.id });
  validListId1 = validList1.id;
  validListId2 = validList2.id;
});

describe("Custom Lists API", () => {
  test("Today list should only return valid tasks", async () => {
    let today = await getCustomListById("today", false, { user: router1.user });
    expect(today!.tasks).toHaveLength(0);
    const title = "Todo today!";
    await createTask({
      listId: validListId1,
      title,
      dueDate: new Date(),
      createdById: router1.user.id
    });
    today = await getCustomListById("today", false, { user: router1.user });
    expect(today!.tasks).toHaveLength(1);
    expect(today!.tasks[0].title).toBe(title);
  });

  test("Date based list should return newer tasks first", async () => {
    let today = await getCustomListById("today", false, { user: router2.user });
    expect(today!.tasks).toHaveLength(0);
    const now = new Date();
    const earlier = new Date(now.getTime() - 1000);
    await createTask({
      listId: validListId2,
      title: "1",
      dueDate: now,
      createdById: router2.user.id,
      createdAt: earlier
    });
    await createTask({
      listId: validListId2,
      title: "2",
      dueDate: now,
      createdById: router2.user.id,
      createdAt: now
    });
    today = await getCustomListById("today", false, { user: router2.user });
    expect(today!.tasks).toHaveLength(2);
    expect(today!.tasks[0].title).toBe("2");
    expect(today!.tasks[1].title).toBe("1");
  });

  test("Tomorrow list should only return valid tasks", async () => {
    let tomorrowList = await getCustomListById("tomorrow", false, { user: router1.user });
    expect(tomorrowList!.tasks).toHaveLength(0);
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(12, 30, 0, 0);
    const title = "Todo tomorrow!";
    await createTask({
      listId: validListId1,
      title,
      dueDate: tomorrow,
      createdById: router1.user.id
    });
    tomorrowList = await getCustomListById("tomorrow", false, { user: router1.user });
    expect(tomorrowList!.tasks).toHaveLength(1);
    expect(tomorrowList!.tasks[0].title).toBe(title);
  });

  test("High priority list should only return valid tasks", async () => {
    // Create a non-high-priority task (should not appear)
    await createTask({
      listId: validListId1,
      title: "Invalid because not high-priority",
      createdById: router1.user.id
    });
    // Create a high-priority task for different user (should not appear)
    await createTask({
      listId: validListId2,
      title: "Invalid because wrong user",
      priority: "high",
      createdById: router2.user.id
    });
    const title = "Todo high priority!";
    await createTask({
      listId: validListId1,
      title,
      priority: "high",
      createdById: router1.user.id
    });
    const user1lists = await getCustomListById("highPriority", false, { user: router1.user });
    expect(user1lists!.tasks).toHaveLength(1);
    expect(user1lists!.tasks[0].title).toBe(title);
  });

  test("modifyTaskForCustomList sets high priority for highPriority list", () => {
    const taskObj = modifyTaskForCustomList("highPriority", { title: "title" }, { user: router1.user });
    expect(taskObj.priority).toBe("high");
  });

  test("modifyTaskForCustomList sets dueDate to start of today for today list", () => {
    const taskObj = modifyTaskForCustomList("today", { title: "title" }, { user: router1.user });
    expect(taskObj.dueDate).toBeDefined();
    const now = new Date();
    // The due date should be the start of today
    expect(taskObj.dueDate!.getHours()).toBe(0);
    expect(taskObj.dueDate!.getMinutes()).toBe(0);
    expect(taskObj.dueDate!.getSeconds()).toBe(0);
  });

  test("modifyTaskForCustomList sets dueDate to start of tomorrow for tomorrow list", () => {
    const taskObj = modifyTaskForCustomList("tomorrow", { title: "title" }, { user: router1.user });
    expect(taskObj.dueDate).toBeDefined();
    const now = new Date();
    const expectedDay = new Date(now);
    expectedDay.setDate(expectedDay.getDate() + 1);
    expect(taskObj.dueDate!.getDate()).toBe(expectedDay.getDate());
    expect(taskObj.dueDate!.getHours()).toBe(0);
    expect(taskObj.dueDate!.getMinutes()).toBe(0);
  });

  test("Should allow returning additional tasks (completed count)", async () => {
    // Create a fresh router/list so we have clean state
    const freshRouter = await createRouter();
    const freshList = await createList({ title: "Fresh", createdById: freshRouter.user.id });

    await createTask({
      listId: freshList.id,
      title: "completed hp task",
      priority: "high",
      isCompleted: true,
      createdById: freshRouter.user.id
    });

    let list = await getCustomListById("highPriority", false, { user: freshRouter.user });
    // Active tasks should not include completed
    expect(list!.tasks.map(t => t.title)).not.toContain("completed hp task");
    expect(list!.additionalTasks).toBe(1);
    expect(list!.completedTasks).toHaveLength(0);

    list = await getCustomListById("highPriority", true, { user: freshRouter.user });
    expect(list!.completedTasks.map(t => t.title)).toContain("completed hp task");
    expect(list!.additionalTasks).toBe(0);
  });
});
