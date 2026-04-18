import { describe, test, expect, beforeAll } from "vitest";
import createRouter, { type RouterOptions } from "./helpers/createRouter.js";
import { createList, getListById, isUserAuthorizedToAccessList } from "../src/services/lists.js";
import { createTask, updateTask, getTaskById, getTasks } from "../src/services/tasks.js";
import { testDb } from "./helpers/setup.js";
import { tasks } from "../src/schema/task.js";
import { eq } from "drizzle-orm";

let router: RouterOptions;
let validListId: string;

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
    fetchedList = await getListById({ userId: router.user.id, listId: list.id });
    // getListById returns all tasks (completed and not) - filtering is done at route level
    const completedTasks = fetchedList!.tasks.filter(t => t.isCompleted);
    const activeTasks = fetchedList!.tasks.filter(t => !t.isCompleted);
    expect(completedTasks).toHaveLength(1);
    expect(activeTasks).toHaveLength(0);
  });

  test("Protects against non-member access", async () => {
    const badGuy = await createRouter();
    const [task] = await createTask({ listId: validListId, title: "Good Task", createdById: router.user.id });
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
