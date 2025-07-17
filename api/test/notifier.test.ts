import "./helpers/toMatchObject";
import createRouter from "./helpers/createRouter";
import { updateUser } from "../src/controllers/users";
import { connect, disconnect } from "../src/database";
import { createList, updateList } from "../src/controllers/lists";
import { RouterOptions } from "../src/helpers/routeHandler";
import { List } from "../src/schemas/lists";
import { createTask, deleteTask, updateTask } from "../src/controllers/tasks";

beforeAll(async () => {
  await connect();
});

afterAll(async () => {
  await disconnect();
});

afterEach(() => {
  jest.clearAllMocks();
});

describe("Notifier", () => {
  describe("User", () => {
    test("tweaks user.isPushEnabled", async () => {
      const router = await createRouter();
      expect(router.notifier.send).not.toHaveBeenCalled();
      await updateUser({ isPushEnabled: false }, router);
      expect(router.notifier.send).toHaveBeenCalledTimes(1);
      const payload = (router.notifier.send as jest.Mock).mock.calls[0];
      expect(payload[0]).toBe(router.user._id);
      expect(payload[1].title).toBe("You're subscribed!");
    });

    test("tweaks user.pushSubscription", async () => {
      const router = await createRouter();
      expect(router.notifier.send).not.toHaveBeenCalled();
      const fakeSubscription = `${Math.random()}`;
      await updateUser({ pushSubscription: fakeSubscription }, router);
      expect(router.notifier.send).toHaveBeenCalledTimes(1);
      const payload = (router.notifier.send as jest.Mock).mock.calls[0];
      expect(payload[0]).toBe(router.user._id);
      expect(payload[1].title).toBe("You're subscribed!");
    });
  });

  describe("Shared List", () => {
    let sharedList: List;
    let user1: RouterOptions;
    let user2: RouterOptions;

    beforeAll(async () => {
      user1 = await createRouter();
      user2 = await createRouter();
      sharedList = await createList({ title: "shared list" }, user1);
      sharedList = await updateList(sharedList._id, { members: [user1.user._id, user2.user._id] }, user1);
    });

    test("adds task", async () => {
      expect(user1?.notifier.send).toHaveBeenCalledTimes(0);
      await createTask(sharedList._id, { title: "just do it" }, user1);
      expect(user1?.notifier.send).toHaveBeenCalledTimes(1);
      const payload = (user1?.notifier.send as jest.Mock).mock.calls[0];
      expect(payload[0]).toMatchObject(user2?.user._id);
      expect(payload[1].title).toBe("unitTest added just do it to shared list.");
    });

    test("marks task completed", async () => {
      expect(user1?.notifier.send).toHaveBeenCalledTimes(0);
      const task = await createTask(sharedList._id, { title: "just do it" }, user1);
      // reset notification from creation
      (user1?.notifier.send as jest.Mock).mockReset();
      await updateTask(task._id, { isCompleted: true }, user1);
      const payload = (user1?.notifier.send as jest.Mock).mock.calls[0];
      expect(payload[0]).toMatchObject(user2?.user._id);
      expect(payload[1].title).toBe("unitTest completed just do it in shared list.");
    });

    test("updates task", async () => {
      expect(user1?.notifier.send).toHaveBeenCalledTimes(0);
      const task = await createTask(sharedList._id, { title: "old" }, user1);
      // reset notification from creation
      (user1?.notifier.send as jest.Mock).mockReset();
      await updateTask(task._id, { title: "new" }, user1);
      const payload = (user1?.notifier.send as jest.Mock).mock.calls[0];
      expect(payload[0]).toMatchObject(user2?.user._id);
      expect(payload[1].title).toBe("unitTest updated new in shared list.");
    });

    test("deletes task", async () => {
      expect(user1?.notifier.send).toHaveBeenCalledTimes(0);
      const task = await createTask(sharedList._id, { title: "just do it" }, user1);
      // reset notification from creation
      (user1?.notifier.send as jest.Mock).mockReset();
      await deleteTask(task._id, user1);
      const payload = (user1?.notifier.send as jest.Mock).mock.calls[0];
      expect(payload[0]).toMatchObject(user2?.user._id);
      expect(payload[1].title).toBe("unitTest deleted just do it from shared list.");
    });
  });
});
