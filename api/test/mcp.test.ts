import { describe, test, expect, beforeEach, afterEach } from "vitest";
import { Client, StreamableHTTPClientTransport } from "@modelcontextprotocol/client";
import { createMcpHandler, type McpHttpHandler } from "@modelcontextprotocol/server";
import createRouter, { type RouterOptions } from "./helpers/createRouter.js";
import { createBetterDoMcpServer } from "../src/mcp/server.js";
import { createAuthInfo, getUserFromAuthInfo } from "../src/mcp/context.js";
import { createList, updateListMembers } from "../src/services/lists.js";
import { createTask, getTaskById } from "../src/services/tasks.js";
import { todayForTimeZone } from "../src/utils/dueDate.js";
import type { ListSummary, TaskSummary } from "../src/mcp/schemas.js";

interface Connection {
  client: Client;
  handler: McpHttpHandler;
}

const connections: Connection[] = [];

// Mirrors routes/mcp.ts: a stateless handler that builds a fresh server per
// request from the user carried in authInfo, driven in-process by a real client.
// The route's token and origin checks are covered in mcp-route.test.ts.
async function connect(router: RouterOptions): Promise<Client> {
  const handler = createMcpHandler(({ authInfo }) =>
    createBetterDoMcpServer({ user: getUserFromAuthInfo(authInfo), notifier: router.notifier })
  );
  const authInfo = createAuthInfo(router.user, { token: "test", clientId: "test", scopes: ["tasks"] });
  const transport = new StreamableHTTPClientTransport(new URL("http://test.local/api/mcp"), {
    fetch: (url, init) => handler.fetch(new Request(url, init), { authInfo })
  });
  const client = new Client({ name: "betterdo-tests", version: "1.0.0" }, { versionNegotiation: { mode: "auto" } });
  await client.connect(transport);
  connections.push({ client, handler });
  return client;
}

async function call<T = Record<string, unknown>>(client: Client, name: string, args: Record<string, unknown> = {}) {
  const result = await client.callTool({ name, arguments: args });
  if (result.isError) {
    const [content] = result.content as { text: string }[];
    throw new Error(content.text);
  }
  return result.structuredContent as T;
}

async function callExpectingError(client: Client, name: string, args: Record<string, unknown> = {}) {
  const result = await client.callTool({ name, arguments: args });
  expect(result.isError).toBe(true);
  return (result.content as { text: string }[])[0].text;
}

let router: RouterOptions;
let client: Client;

beforeEach(async () => {
  router = await createRouter();
  client = await connect(router);
});

afterEach(async () => {
  for (const { client, handler } of connections.splice(0)) {
    await client.close();
    await handler.close();
  }
});

describe("MCP server", () => {
  test("Advertises the list and task tools", async () => {
    const { tools } = await client.listTools();
    expect(tools.map(tool => tool.name).sort()).toEqual(
      [
        "create_list",
        "create_task",
        "get_lists",
        "get_task",
        "get_tasks",
        "reorder_tasks",
        "update_list",
        "update_task"
      ].sort()
    );
    expect(tools.find(tool => tool.name === "get_lists")?.annotations?.readOnlyHint).toBe(true);
  });

  test("Serves the stateless 2026-07-28 protocol", () => {
    expect(client.getNegotiatedProtocolVersion()).toBe("2026-07-28");
  });

  test("Includes today's date in the user's timezone in the instructions", () => {
    expect(client.getInstructions()).toContain(`Today is ${todayForTimeZone(router.user.timeZone)}`);
  });
});

describe("MCP list tools", () => {
  test("get_lists returns the inbox first with task counts", async () => {
    const done = await call<TaskSummary>(client, "create_task", { title: "Inbox task" });
    await call(client, "update_task", { taskId: done.id, isCompleted: true });
    await call(client, "create_task", { title: "Another" });

    const { lists } = await call<{ lists: ListSummary[] }>(client, "get_lists");
    expect(lists[0]).toMatchObject({
      type: "inbox",
      title: "Inbox",
      incompleteTaskCount: 1,
      completedTaskCount: 1,
      memberCount: 1
    });
  });

  test("get_lists includes enabled smart lists after the inbox", async () => {
    const smartRouter = await createRouter();
    smartRouter.user.customLists = { highPriority: true, today: false };
    const smartClient = await connect(smartRouter);

    const { lists } = await call<{ lists: ListSummary[] }>(smartClient, "get_lists");
    expect(lists.map(list => [list.type, list.id])).toEqual([
      ["inbox", lists[0].id],
      ["smart", "highPriority"]
    ]);
  });

  test("create_list creates a list that shows up in get_lists", async () => {
    const created = await call<ListSummary>(client, "create_list", { title: "Groceries", color: "#22c55e" });
    expect(created).toMatchObject({ title: "Groceries", color: "#22c55e", type: "default", memberCount: 1 });

    const { lists } = await call<{ lists: ListSummary[] }>(client, "get_lists");
    expect(lists.map(list => list.id)).toContain(created.id);
  });

  test("create_list rejects invalid input", async () => {
    expect(await callExpectingError(client, "create_list", { title: "  " })).toMatch(/Title is required/);
    expect(await callExpectingError(client, "create_list", { title: "Ok", color: "red" })).toMatch(/hex/);
  });

  test("update_list renames and recolors a list", async () => {
    const list = await createList({ title: "Old", createdById: router.user.id });
    const updated = await call<ListSummary>(client, "update_list", { listId: list.id, title: "New", color: "#000000" });
    expect(updated).toMatchObject({ id: list.id, title: "New", color: "#000000" });
  });

  test("update_list accepts the inbox alias", async () => {
    const updated = await call<ListSummary>(client, "update_list", { listId: "inbox", color: "#111111" });
    expect(updated).toMatchObject({ type: "inbox", color: "#111111" });
  });

  test("update_list refuses smart lists, empty updates and other users' lists", async () => {
    const stranger = await createRouter();
    const strangersList = await createList({ title: "Private", createdById: stranger.user.id });
    const list = await createList({ title: "Mine", createdById: router.user.id });

    expect(await callExpectingError(client, "update_list", { listId: "today", title: "x" })).toMatch(/smart list/);
    expect(await callExpectingError(client, "update_list", { listId: list.id })).toMatch(/at least one/);
    expect(await callExpectingError(client, "update_list", { listId: strangersList.id, title: "Mine now" })).toMatch(
      /not found/
    );
    expect(await callExpectingError(client, "update_list", { listId: "not-a-list", title: "x" })).toMatch(
      /Invalid arguments/
    );
  });
});

describe("MCP task tools", () => {
  test("create_task defaults to the inbox and adds to the top", async () => {
    const first = await call<TaskSummary>(client, "create_task", { title: "First" });
    const second = await call<TaskSummary>(client, "create_task", { title: "Second", priority: "high" });
    expect(second).toMatchObject({ title: "Second", priority: "high", isCompleted: false, dueDate: null });

    const { list, tasks } = await call<{ list: { type: string }; tasks: TaskSummary[] }>(client, "get_tasks", {
      listId: "inbox"
    });
    expect(list.type).toBe("inbox");
    expect(tasks.map(task => task.id)).toEqual([second.id, first.id]);
  });

  test("Due dates round-trip as calendar dates stored at local midnight", async () => {
    const task = await call<TaskSummary>(client, "create_task", { title: "Holiday", dueDate: "2026-12-25" });
    expect(task.dueDate).toBe("2026-12-25");

    // Matches how the app stores due dates (see routes/tasks.ts).
    const stored = await getTaskById(task.id);
    expect(stored!.dueDate).toEqual(new Date(2026, 11, 25));

    const cleared = await call<TaskSummary>(client, "update_task", { taskId: task.id, dueDate: null });
    expect(cleared.dueDate).toBeNull();
  });

  test("create_task in a smart list goes to the inbox with that list's defaults", async () => {
    const task = await call<TaskSummary>(client, "create_task", { title: "Do it today", listId: "today" });
    const { tasks } = await call<{ tasks: TaskSummary[] }>(client, "get_tasks", { listId: "inbox" });

    expect(task.dueDate).toBe(todayForTimeZone(router.user.timeZone));
    expect(tasks.map(t => t.id)).toContain(task.id);

    const explicit = await call<TaskSummary>(client, "create_task", {
      title: "Explicit date wins",
      listId: "today",
      dueDate: "2030-01-01"
    });
    expect(explicit.dueDate).toBe("2030-01-01");
  });

  test("create_task rejects lists the user is not a member of", async () => {
    const stranger = await createRouter();
    const strangersList = await createList({ title: "Private", createdById: stranger.user.id });
    expect(await callExpectingError(client, "create_task", { title: "Sneaky", listId: strangersList.id })).toMatch(
      /not found/
    );
  });

  test("get_tasks for a smart list spans all of the user's lists", async () => {
    const list = await createList({ title: "Work", createdById: router.user.id });
    const urgent = await call<TaskSummary>(client, "create_task", {
      title: "Urgent",
      listId: list.id,
      priority: "high"
    });
    await call(client, "create_task", { title: "Not urgent", listId: list.id });

    const result = await call<{ list: { id: string; type: string }; tasks: TaskSummary[] }>(client, "get_tasks", {
      listId: "highPriority"
    });
    expect(result.list).toMatchObject({ id: "highPriority", type: "smart" });
    expect(result.tasks.map(task => [task.id, task.listId])).toEqual([[urgent.id, list.id]]);
  });

  test("get_tasks rejects lists the user is not a member of", async () => {
    const stranger = await createRouter();
    const strangersList = await createList({ title: "Private", createdById: stranger.user.id });
    expect(await callExpectingError(client, "get_tasks", { listId: strangersList.id })).toMatch(/not found/);
  });

  test("get_task returns notes, creator and list", async () => {
    const list = await createList({ title: "Projects", createdById: router.user.id });
    const task = await call<TaskSummary>(client, "create_task", {
      title: "Write spec",
      listId: list.id,
      notes: "<p>Outline first</p>"
    });

    const detail = await call(client, "get_task", { taskId: task.id });
    expect(detail).toMatchObject({
      id: task.id,
      title: "Write spec",
      notes: "<p>Outline first</p>",
      list: { id: list.id, title: "Projects" },
      createdBy: { id: router.user.id, name: router.user.name, email: router.user.email }
    });
  });

  test("Completing a task hides it from the default view", async () => {
    const task = await call<TaskSummary>(client, "create_task", { title: "Finish me" });

    const completed = await call<TaskSummary>(client, "update_task", { taskId: task.id, isCompleted: true });
    expect(completed.isCompleted).toBe(true);
    expect(completed.completedAt).not.toBeNull();

    const defaultView = await call<{ tasks: TaskSummary[]; completedTasks: TaskSummary[]; completedTaskCount: number }>(
      client,
      "get_tasks",
      { listId: "inbox" }
    );
    expect(defaultView.tasks.map(t => t.id)).not.toContain(task.id);
    expect(defaultView.completedTasks).toEqual([]);
    expect(defaultView.completedTaskCount).toBe(1);

    const withCompleted = await call<{ completedTasks: TaskSummary[] }>(client, "get_tasks", {
      listId: "inbox",
      includeCompleted: true
    });
    expect(withCompleted.completedTasks.map(t => t.id)).toEqual([task.id]);

    const reopened = await call<TaskSummary>(client, "update_task", { taskId: task.id, isCompleted: false });
    expect(reopened.completedAt).toBeNull();
  });

  test("update_task edits fields and moves tasks between lists", async () => {
    const list = await createList({ title: "Someday", createdById: router.user.id });
    const task = await call<TaskSummary>(client, "create_task", { title: "Draft", notes: "old" });

    const updated = await call<TaskSummary>(client, "update_task", {
      taskId: task.id,
      title: "Final",
      priority: "low",
      notes: null,
      listId: list.id
    });
    expect(updated).toMatchObject({ title: "Final", priority: "low", listId: list.id });
    expect((await getTaskById(task.id))!.notes).toBeNull();

    const { tasks } = await call<{ tasks: TaskSummary[] }>(client, "get_tasks", { listId: list.id });
    expect(tasks.map(t => t.id)).toEqual([task.id]);
  });

  test("update_task refuses moving a task into another user's list", async () => {
    const stranger = await createRouter();
    const strangersList = await createList({ title: "Private", createdById: stranger.user.id });
    const task = await call<TaskSummary>(client, "create_task", { title: "Stay put" });

    expect(await callExpectingError(client, "update_task", { taskId: task.id, listId: strangersList.id })).toMatch(
      /not found/
    );
    expect((await getTaskById(task.id))!.listId).not.toBe(strangersList.id);
  });

  test("reorder_tasks sets the order of incomplete tasks", async () => {
    const list = await createList({ title: "Errands", createdById: router.user.id });
    const a = await call<TaskSummary>(client, "create_task", { title: "A", listId: list.id });
    const b = await call<TaskSummary>(client, "create_task", { title: "B", listId: list.id });
    const c = await call<TaskSummary>(client, "create_task", { title: "C", listId: list.id });
    const done = await call<TaskSummary>(client, "create_task", { title: "Done", listId: list.id });
    await call(client, "update_task", { taskId: done.id, isCompleted: true });

    // New tasks go on top, so the current order is C, B, A.
    const result = await call<{ list: { id: string }; tasks: TaskSummary[] }>(client, "reorder_tasks", {
      listId: list.id,
      taskIds: [a.id, b.id, c.id]
    });
    expect(result.list.id).toBe(list.id);
    expect(result.tasks.map(task => task.title)).toEqual(["A", "B", "C"]);

    const { tasks } = await call<{ tasks: TaskSummary[] }>(client, "get_tasks", { listId: list.id });
    expect(tasks.map(task => task.title)).toEqual(["A", "B", "C"]);
  });

  test("reorder_tasks accepts the inbox alias and works for shared list members", async () => {
    const first = await call<TaskSummary>(client, "create_task", { title: "First" });
    const second = await call<TaskSummary>(client, "create_task", { title: "Second" });
    const inbox = await call<{ tasks: TaskSummary[] }>(client, "reorder_tasks", {
      listId: "inbox",
      taskIds: [first.id, second.id]
    });
    expect(inbox.tasks.map(task => task.title)).toEqual(["First", "Second"]);

    const owner = await createRouter();
    const shared = await createList({ title: "Shared", createdById: owner.user.id });
    await updateListMembers(shared.id, [owner.user.id, router.user.id]);
    const [x] = await createTask({ title: "X", listId: shared.id, createdById: owner.user.id });
    const [y] = await createTask({ title: "Y", listId: shared.id, createdById: owner.user.id });
    const sharedResult = await call<{ tasks: TaskSummary[] }>(client, "reorder_tasks", {
      listId: shared.id,
      taskIds: [x.id, y.id]
    });
    expect(sharedResult.tasks.map(task => task.title)).toEqual(["X", "Y"]);
  });

  test("reorder_tasks rejects incomplete, completed, foreign or duplicated tasks", async () => {
    const list = await createList({ title: "Chores", createdById: router.user.id });
    const a = await call<TaskSummary>(client, "create_task", { title: "A", listId: list.id });
    const b = await call<TaskSummary>(client, "create_task", { title: "B", listId: list.id });
    const done = await call<TaskSummary>(client, "create_task", { title: "Done", listId: list.id });
    await call(client, "update_task", { taskId: done.id, isCompleted: true });
    const other = await call<TaskSummary>(client, "create_task", { title: "Elsewhere" });

    const reorder = (taskIds: string[]) => callExpectingError(client, "reorder_tasks", { listId: list.id, taskIds });
    expect(await reorder([a.id])).toContain(`Missing: ${b.id}`);
    expect(await reorder([a.id, b.id, done.id])).toContain(`Not an incomplete task in this list: ${done.id}`);
    expect(await reorder([a.id, b.id, other.id])).toContain(`Not an incomplete task in this list: ${other.id}`);
    expect(await reorder([a.id, b.id, b.id])).toContain(`Duplicated: ${b.id}`);

    // Nothing changed: newest first.
    const { tasks } = await call<{ tasks: TaskSummary[] }>(client, "get_tasks", { listId: list.id });
    expect(tasks.map(task => task.title)).toEqual(["B", "A"]);
  });

  test("reorder_tasks refuses smart lists and other users' lists", async () => {
    expect(await callExpectingError(client, "reorder_tasks", { listId: "today", taskIds: [] })).toMatch(/smart list/);

    const stranger = await createRouter();
    const strangersList = await createList({ title: "Private", createdById: stranger.user.id });
    const [secret] = await createTask({ title: "Secret", listId: strangersList.id, createdById: stranger.user.id });
    expect(
      await callExpectingError(client, "reorder_tasks", { listId: strangersList.id, taskIds: [secret.id] })
    ).toMatch(/not found/);
  });

  test("Tasks in other users' lists are not accessible", async () => {
    const stranger = await createRouter();
    const strangersList = await createList({ title: "Private", createdById: stranger.user.id });
    const [secret] = await createTask({ title: "Secret", listId: strangersList.id, createdById: stranger.user.id });

    expect(await callExpectingError(client, "get_task", { taskId: secret.id })).toMatch(/not found/);
    expect(await callExpectingError(client, "update_task", { taskId: secret.id, title: "Mine" })).toMatch(/not found/);
    expect((await getTaskById(secret.id))!.title).toBe("Secret");
  });

  test("Shared list members can manage tasks and others are notified", async () => {
    const list = await createList({ title: "Household", createdById: router.user.id });
    const member = await createRouter();
    await updateListMembers(list.id, [router.user.id, member.user.id]);
    const memberClient = await connect(member);

    const task = await call<TaskSummary>(memberClient, "create_task", { title: "Buy milk", listId: list.id });
    await call(client, "update_task", { taskId: task.id, isCompleted: true });

    // Each actor's notifier pings the *other* members of the shared list.
    expect(member.notifier.send).toHaveBeenCalledWith(
      router.user.id,
      expect.objectContaining({ title: expect.stringContaining("added Buy milk to Household") })
    );
    expect(router.notifier.send).toHaveBeenCalledWith(
      member.user.id,
      expect.objectContaining({ title: expect.stringContaining("completed Buy milk in Household") })
    );
  });
});
