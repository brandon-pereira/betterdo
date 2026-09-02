import { describe, test, expect, beforeAll } from "vitest";
import createRouter, { type RouterOptions } from "./helpers/createRouter.js";
import DrizzleNotificationAdapter from "../src/helpers/drizzleNotificationAdapter.js";

interface TestPayload {
  title: string;
}

let router: RouterOptions;
const adapter = new DrizzleNotificationAdapter<TestPayload>();

beforeAll(async () => {
  router = await createRouter();
});

describe("DrizzleNotificationAdapter", () => {
  test("schedules and fetches a notification once its date has passed", async () => {
    const past = new Date(Date.now() - 60_000);
    await adapter.scheduleNotification(past, router.user.id, { title: "past due" });

    const fetched = await adapter.fetchNotifications(new Date());
    const match = fetched.find(n => n.payload.title === "past due");

    expect(match).toBeDefined();
    expect(match!.userId).toBe(router.user.id);
    expect(match!.id).toBeTruthy();
  });

  test("does not fetch notifications scheduled for the future", async () => {
    const future = new Date(Date.now() + 60 * 60_000);
    await adapter.scheduleNotification(future, router.user.id, { title: "future" });

    const fetched = await adapter.fetchNotifications(new Date());
    expect(fetched.find(n => n.payload.title === "future")).toBeUndefined();
  });

  test("fetches notifications due exactly now (inclusive boundary)", async () => {
    const now = new Date();
    await adapter.scheduleNotification(now, router.user.id, { title: "boundary" });

    const fetched = await adapter.fetchNotifications(now);
    expect(fetched.find(n => n.payload.title === "boundary")).toBeDefined();
  });

  test("clears a notification and reports success", async () => {
    const past = new Date(Date.now() - 60_000);
    await adapter.scheduleNotification(past, router.user.id, { title: "to clear" });

    const before = await adapter.fetchNotifications(new Date());
    const target = before.find(n => n.payload.title === "to clear");
    expect(target).toBeDefined();

    const cleared = await adapter.clearNotification(target!.id);
    expect(cleared).toBe(true);

    const after = await adapter.fetchNotifications(new Date());
    expect(after.find(n => n.id === target!.id)).toBeUndefined();
  });

  test("clearing a non-existent notification reports false", async () => {
    const cleared = await adapter.clearNotification("00000000-0000-0000-0000-000000000000");
    expect(cleared).toBe(false);
  });
});
