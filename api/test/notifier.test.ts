import { describe, test, expect, beforeAll, afterEach, vi, type Mock } from "vitest";
import createRouter, { type RouterOptions } from "./helpers/createRouter.js";
import { updateUser } from "../src/services/users.js";
import { createList, updateListMembers, getListById } from "../src/services/lists.js";
import {
  createTaskWithNotification,
  updateTaskWithNotification,
  deleteTaskWithNotification
} from "../src/services/tasks.js";

afterEach(() => {
  vi.clearAllMocks();
});

describe("Notifier", () => {
  describe("User", () => {
    test("tweaks user.isPushEnabled", async () => {
      const router = await createRouter();
      expect(router.notifier.send).not.toHaveBeenCalled();
      await updateUser({ isPushEnabled: false }, router);
      expect(router.notifier.send).toHaveBeenCalledTimes(1);
      const payload = (router.notifier.send as Mock).mock.calls[0];
      expect(payload[0]).toBe(router.user.id);
      expect(payload[1].title).toBe("You're subscribed!");
    });

    test("tweaks user.pushSubscription", async () => {
      const router = await createRouter();
      expect(router.notifier.send).not.toHaveBeenCalled();
      const fakeSubscription = `${Math.random()}`;
      await updateUser({ pushSubscription: fakeSubscription }, router);
      expect(router.notifier.send).toHaveBeenCalledTimes(1);
      const payload = (router.notifier.send as Mock).mock.calls[0];
      expect(payload[0]).toBe(router.user.id);
      expect(payload[1].title).toBe("You're subscribed!");
    });
  });

  describe("Shared List", () => {
    let sharedList: Awaited<ReturnType<typeof getListById>>;
    let user1: RouterOptions;
    let user2: RouterOptions;

    beforeAll(async () => {
      user1 = await createRouter();
      user2 = await createRouter();
      const list = await createList({ title: "shared list", createdById: user1.user.id });
      await updateListMembers(list.id, [user1.user.id, user2.user.id]);
      sharedList = await getListById({ userId: user1.user.id, listId: list.id });
    });

    test("adds task", async () => {
      expect(user1.notifier.send).toHaveBeenCalledTimes(0);
      await createTaskWithNotification(
        { title: "just do it", listId: sharedList!.id, createdById: user1.user.id },
        user1
      );
      expect(user1.notifier.send).toHaveBeenCalledTimes(1);
      const payload = (user1.notifier.send as Mock).mock.calls[0];
      expect(payload[0]).toBe(user2.user.id);
      expect(payload[1].title).toBe("unitTest added just do it to shared list.");
    });

    test("marks task completed", async () => {
      expect(user1.notifier.send).toHaveBeenCalledTimes(0);
      const task = await createTaskWithNotification(
        { title: "just do it", listId: sharedList!.id, createdById: user1.user.id },
        user1
      );
      // reset notification from creation
      (user1.notifier.send as Mock).mockReset();
      await updateTaskWithNotification(task.id, { isCompleted: true }, user1);
      const payload = (user1.notifier.send as Mock).mock.calls[0];
      expect(payload[0]).toBe(user2.user.id);
      expect(payload[1].title).toBe("unitTest completed just do it in shared list.");
    });

    test("updates task", async () => {
      expect(user1.notifier.send).toHaveBeenCalledTimes(0);
      const task = await createTaskWithNotification(
        { title: "old", listId: sharedList!.id, createdById: user1.user.id },
        user1
      );
      // reset notification from creation
      (user1.notifier.send as Mock).mockReset();
      await updateTaskWithNotification(task.id, { title: "new" }, user1);
      const payload = (user1.notifier.send as Mock).mock.calls[0];
      expect(payload[0]).toBe(user2.user.id);
      expect(payload[1].title).toBe("unitTest updated new in shared list.");
    });

    test("deletes task", async () => {
      expect(user1.notifier.send).toHaveBeenCalledTimes(0);
      const task = await createTaskWithNotification(
        { title: "just do it", listId: sharedList!.id, createdById: user1.user.id },
        user1
      );
      // reset notification from creation
      (user1.notifier.send as Mock).mockReset();
      await deleteTaskWithNotification(task.id, user1);
      const payload = (user1.notifier.send as Mock).mock.calls[0];
      expect(payload[0]).toBe(user2.user.id);
      expect(payload[1].title).toBe("unitTest deleted just do it from shared list.");
    });
  });
});
