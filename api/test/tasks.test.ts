import { describe, test, expect, vi, beforeAll } from "vitest";
import createRouter, { type RouterOptions } from "./helpers/createRouter.js";
import { createList, getListById, isUserAuthorizedToAccessList } from "../src/services/lists.js";
import { createTask, updateTask, getTaskById, getTasks } from "../src/services/tasks.js";
import { testDb } from "./helpers/setup.js";
import { tasks } from "../src/schema/task.js";
import { eq } from "drizzle-orm";
import { TASK_TITLE_MAX_LENGTH } from "@betterdo/shared/constants";
import { createTaskSchema, updateTaskSchema } from "../src/validators/tasks.js";

let router: RouterOptions;
let validListId: string;

// Route tests sign in as the test user instead of looking up a real session.
vi.mock("../src/middlewares/authMiddleware.js", async () => {
  const { createMiddleware } = await import("hono/factory");
  return {
    authMiddleware: createMiddleware(async (c, next) => {
      c.set("user", router.user);
      return next();
    })
  };
});
vi.mock("../src/notifier.js", () => ({ getNotifier: () => router.notifier }));

const { default: tasksApi } = await import("../src/routes/tasks.js");

const sendToTasksApi = (method: string, path: string, body: unknown) =>
  tasksApi.request(path, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });

beforeAll(async () => {
  router = await createRouter();
  const validList = await createList({ title: "Valid List", createdById: router.user.id });
  validListId = validList.id;
});

describe("Tasks API", () => {
  test("Can be created with valid data", async () => {
    const [task] = await createTask({ listId: validListId, title: "Test", createdById: router.user.id });
    expect(task.listId).toEqual(validListId);
    expect(task.title).toBe("Test");
  });

  test("Can retrieve task details when queried", async () => {
    const [createdTask] = await createTask({ listId: validListId, title: "Test", createdById: router.user.id });
    const task = await getTaskById(createdTask.id);
    expect(task).toBeDefined();
    expect(task!.listId).toBe(validListId);
    expect(task!.id).toBe(createdTask.id);
    expect(task!.title).toBe("Test");
  });

  test("Task belongs to the correct list", async () => {
    const list = await createList({ title: "New List", createdById: router.user.id });
    const [task] = await createTask({ listId: list.id, title: "Test", createdById: router.user.id });
    const listTasks = await getTasks({ listId: list.id });
    expect(listTasks.map(t => t.id)).toContain(task.id);
    expect(listTasks).toHaveLength(1);
  });

  test("Removing task removes it from list query results", async () => {
    const list = await createList({ title: "New List", createdById: router.user.id });
    const [task] = await createTask({ listId: list.id, title: "Test", createdById: router.user.id });
    let listTasks = await getTasks({ listId: list.id });
    expect(listTasks).toHaveLength(1);
    await testDb.delete(tasks).where(eq(tasks.id, task.id));
    listTasks = await getTasks({ listId: list.id });
    expect(listTasks).toHaveLength(0);
  });

  test("Allows list to be changed via the updateTask method", async () => {
    const list1 = await createList({ title: "New List 1", createdById: router.user.id });
    const list2 = await createList({ title: "New List 2", createdById: router.user.id });
    const [task] = await createTask({ listId: list1.id, title: "Test", createdById: router.user.id });
    await updateTask(task.id, { listId: list2.id });
    const list1Tasks = await getTasks({ listId: list1.id });
    const list2Tasks = await getTasks({ listId: list2.id });
    expect(list1Tasks.map(t => t.id)).not.toContain(task.id);
    expect(list2Tasks.map(t => t.id)).toContain(task.id);
  });

  test("Allows tasks to be set to complete", async () => {
    const list = await createList({ title: "New List", createdById: router.user.id });
    const [task] = await createTask({ listId: list.id, title: "Test", createdById: router.user.id });
    expect(task.isCompleted).toBe(false);
    const [updated] = await updateTask(task.id, { isCompleted: true });
    expect(updated.isCompleted).toBe(true);
    const [toggledBack] = await updateTask(task.id, { isCompleted: false });
    expect(toggledBack.isCompleted).toBe(false);
  });

  test("Completed tasks are separated in list view", async () => {
    const list = await createList({ title: "New List", createdById: router.user.id });
    const [task] = await createTask({ listId: list.id, title: "Test", createdById: router.user.id });
    let fetchedList = await getListById({ userId: router.user.id, listId: list.id });
    expect(fetchedList!.tasks).toHaveLength(1);
    await updateTask(task.id, { isCompleted: true });

    // Without includeCompleted: completed tasks are excluded from `tasks` and
    // only surfaced as a count via `additionalTasks`.
    fetchedList = await getListById({ userId: router.user.id, listId: list.id });
    expect(fetchedList!.tasks).toHaveLength(0);
    expect(fetchedList!.completedTasks).toHaveLength(0);
    expect(fetchedList!.additionalTasks).toBe(1);

    // With includeCompleted: completed tasks are hydrated and additionalTasks resets to 0.
    fetchedList = await getListById({ userId: router.user.id, listId: list.id, includeCompleted: true });
    expect(fetchedList!.tasks).toHaveLength(0);
    expect(fetchedList!.completedTasks).toHaveLength(1);
    expect(fetchedList!.completedTasks[0].title).toBe("Test");
    expect(fetchedList!.additionalTasks).toBe(0);
  });

  test("Protects against non-member access", async () => {
    const badGuy = await createRouter();
    await createTask({ listId: validListId, title: "Good Task", createdById: router.user.id });
    // Good user can access
    expect(await isUserAuthorizedToAccessList({ userId: router.user.id, listId: validListId })).toBe(true);
    // Bad user cannot access
    expect(await isUserAuthorizedToAccessList({ userId: badGuy.user.id, listId: validListId })).toBe(false);
    // Bad user cannot move task to their list
    const badGuysList = await createList({ title: "Bad Guys List", createdById: badGuy.user.id });
    expect(await isUserAuthorizedToAccessList({ userId: router.user.id, listId: badGuysList.id })).toBe(false);
  });

  test("Default priority is normal", async () => {
    const [task] = await createTask({ listId: validListId, title: "Test", createdById: router.user.id });
    expect(task.priority).toBe("normal");
  });

  test("Task is created with isCompleted false by default", async () => {
    const [task] = await createTask({ listId: validListId, title: "Test", createdById: router.user.id });
    expect(task.isCompleted).toBe(false);
  });

  test("Task title is stored correctly", async () => {
    const [task] = await createTask({ listId: validListId, title: "My Special Task", createdById: router.user.id });
    const fetched = await getTaskById(task.id);
    expect(fetched!.title).toBe("My Special Task");
  });

  test("Task tracks createdById", async () => {
    const [task] = await createTask({ listId: validListId, title: "Test", createdById: router.user.id });
    expect(task.createdById).toBe(router.user.id);
  });
});

describe("Tasks Validation", () => {
  test("Accepts a title at the max length", () => {
    const title = "a".repeat(TASK_TITLE_MAX_LENGTH);
    expect(createTaskSchema.safeParse({ listId: "inbox", title }).success).toBe(true);
    expect(updateTaskSchema.safeParse({ title }).success).toBe(true);
  });

  test("Rejects a title over the max length", () => {
    const title = "a".repeat(TASK_TITLE_MAX_LENGTH + 1);
    expect(createTaskSchema.safeParse({ listId: "inbox", title }).success).toBe(false);
    expect(updateTaskSchema.safeParse({ title }).success).toBe(false);
  });

  test("Rejects a whitespace-only title", () => {
    expect(createTaskSchema.safeParse({ listId: "inbox", title: "   " }).success).toBe(false);
    expect(updateTaskSchema.safeParse({ title: "   " }).success).toBe(false);
  });

  test("Trims surrounding whitespace from the title", () => {
    const result = createTaskSchema.safeParse({ listId: "inbox", title: "  Buy milk  " });
    expect(result.success && result.data.title).toBe("Buy milk");
  });

  test("Database column fits a max length title", async () => {
    const title = "a".repeat(TASK_TITLE_MAX_LENGTH);
    const [task] = await createTask({ listId: validListId, title, createdById: router.user.id });
    expect(task.title).toBe(title);
  });
});

describe("Tasks route list access", () => {
  let otherListId: string;

  beforeAll(async () => {
    const other = await createRouter();
    otherListId = (await createList({ title: "Theirs", createdById: other.user.id })).id;
  });

  test("Can create a task in a list the user belongs to", async () => {
    const res = await sendToTasksApi("PUT", "/", { listId: validListId, title: "Allowed" });
    expect(res.status).toBe(200);
    expect((await getTasks({ listId: validListId })).map(t => t.title)).toContain("Allowed");
  });

  test("Can't create a task in another user's list", async () => {
    const res = await sendToTasksApi("PUT", "/", { listId: otherListId, title: "Intruder" });
    expect(res.status).toBe(404);
    expect(await getTasks({ listId: otherListId })).toHaveLength(0);
  });

  test("Rejects a malformed list ID instead of erroring", async () => {
    const res = await sendToTasksApi("PUT", "/", { listId: "not-a-list", title: "Bad" });
    expect(res.status).toBe(404);
  });

  test("Can't move a task into another user's list", async () => {
    const [task] = await createTask({ listId: validListId, title: "Stay put", createdById: router.user.id });
    const res = await sendToTasksApi("POST", `/${task.id}`, { listId: otherListId });
    expect(res.status).toBe(404);
    expect((await getTaskById(task.id))?.listId).toBe(validListId);
  });

  test("Can move a task between the user's own lists", async () => {
    const secondListId = (await createList({ title: "Mine too", createdById: router.user.id })).id;
    const [task] = await createTask({ listId: validListId, title: "Move me", createdById: router.user.id });
    const res = await sendToTasksApi("POST", `/${task.id}`, { listId: secondListId });
    expect(res.status).toBe(200);
    expect((await getTaskById(task.id))?.listId).toBe(secondListId);
  });
});
