import "./helpers/toMatchObject";
import createRouter from "./helpers/createRouter";
import db, { connect, disconnect } from "../src/database";
import { getLists, createList, updateList, deleteList } from "../src/controllers/lists";
import { createTask } from "../src/controllers/tasks";
import { List } from "../src/schemas/lists";

const { Lists } = db;

beforeAll(async () => {
  await connect();
});

afterAll(async () => {
  await disconnect();
});

describe("Lists", () => {
  describe("Lists API", () => {
    test("Can be created with valid data", async () => {
      expect.assertions(2);
      const router = await createRouter();
      const { user } = router;
      const list = await createList({ title: "Test" }, router);
      expect(list.title).toBe("Test");
      expect(list.members[0]._id).toMatchId(user._id);
    });

    test("Can fetch single list", async () => {
      const router = await createRouter();
      const { user } = router;
      const list = await createList({ title: "Test" }, router);
      expect(list).toHaveProperty("_id");
      expect(list).toHaveProperty("id");
      expect(list.additionalTasks).toBe(0);
      expect(list.color).toBe("#666666");
      expect(list.completedTasks).toHaveLength(0);
      expect(list.members).toHaveLength(1);
      expect(list.members[0]).toMatchObject({
        _id: user._id,
        firstName: user.firstName
      });
      expect(list.owner).toBe(user._id);
      expect(list.tasks).toHaveLength(0);
      expect(list.title).toBe("Test");
      expect(list.type).toBe("default");
    });

    test("Provides clear error messages when invalid data provided", async () => {
      const router = await createRouter();
      await expect(createList({ title: "" }, router)).rejects.toThrow(
        `List validation failed: title: Path \`title\` is required.`
      );
    });

    test("Protects sensitive fields", async () => {
      expect.assertions(1);
      const router = await createRouter();
      const list = await createList({ title: "Evil Task", type: "inbox" }, router);
      expect(list.type).toBe("default");
    });

    test("Protects against non-member modification", async () => {
      const userRequest1 = await createRouter();
      const userRequest2 = await createRouter();
      const list = await createList({ title: "Good List" }, userRequest1);
      await expect(updateList(list._id, { title: "Malicious List" }, userRequest2)).rejects.toThrow("Invalid List ID");
    });

    test("Protects against fetching invalid list ID", async () => {
      const router = await createRouter();
      await expect(createTask("INVALID_ID", { title: "Good List" }, router)).rejects.toThrow("Invalid List ID");
    });

    test("Allows list to be modified", async () => {
      expect.assertions(1);
      const router = await createRouter();
      const list = await createList({ title: "OK List" }, router);
      const updatedList = await updateList(list._id, { title: "Good List" }, router);
      expect(updatedList.title).toBe("Good List");
    });

    test("Allows list to be deleted", async () => {
      expect.assertions(1);
      const router = await createRouter();
      const list = await createList({ title: "Temp List" }, router);
      const deletedList = await deleteList(list._id, router);
      expect(deletedList.success).toBeTruthy();
    });

    test("When deleting lists, removes for all users", async () => {
      expect.assertions(2);
      const userRequest1 = await createRouter();
      const userRequest2 = await createRouter();
      const list = await createList({ title: "Temp List" }, userRequest1);
      // Add user 2 to the list
      await updateList(list._id, { members: [userRequest1.user._id, userRequest2.user._id] }, userRequest1);
      // Delete the list
      await deleteList(list._id, userRequest1);
      // We query db directly because .populate removes invalid ids
      const lists1 = await db.Users.findById(userRequest1.user._id);
      const lists2 = await db.Users.findById(userRequest2.user._id);
      // Ensure removed from all users
      expect(lists1?.lists).toHaveLength(0);
      expect(lists2?.lists).toHaveLength(0);
    });

    test("Allows fetching multiple lists", async () => {
      expect.assertions(1);
      const router = await createRouter();
      const randomNumber = Math.floor(Math.random() * 10) + 1; // random between 1 and 10
      for (const i of [...Array(randomNumber).keys()]) {
        await createList({ title: `List ${i}` }, router);
      }
      const fetchedLists = await getLists(undefined, {}, router);
      expect(fetchedLists).toHaveLength(randomNumber + 1); // all created lists and inbox
    });

    test("Protects against fetching list non-member list", async () => {
      const userRequest1 = await createRouter();
      const userRequest2 = await createRouter();
      const list = await createList({ title: "Good List" }, userRequest1);
      await expect(getLists(list._id, {}, userRequest2)).rejects.toThrow("Invalid List ID");
    });

    test("Protects against non-member deletion", async () => {
      const userRequest1 = await createRouter();
      const userRequest2 = await createRouter();
      const list = await createList({ title: "Good List" }, userRequest1);
      await expect(deleteList(list._id, userRequest2)).rejects.toThrow("Invalid List ID");
    });

    test("Allows members to be added to list", async () => {
      expect.assertions(1);
      const userRequest1 = await createRouter();
      const userRequest2 = await createRouter();
      const user1 = userRequest1.user;
      const user2 = userRequest2.user;
      const newList = await createList({ title: "Title" }, userRequest1);
      await updateList(newList._id, { members: [user1._id, user2._id] }, userRequest1);
      const list = await getLists(newList._id, {}, userRequest1);
      expect(list.members.map(m => m._id)).toEqual(expect.arrayContaining([user1._id, user2._id]));
    });

    test("Protects against removing owner from list", async () => {
      const userRequest1 = await createRouter();
      const userRequest2 = await createRouter();
      const user1 = userRequest1.user;
      const user2 = userRequest2.user;
      const list = await createList({ title: "Title" }, userRequest1);
      await updateList(list._id, { members: [user1._id, user2._id] }, userRequest1);
      await expect(updateList(list._id, { members: [user2._id] }, userRequest2)).rejects.toThrow(
        "List validation failed: members: Not permitted to remove owner!"
      );
    });

    test("Allows lists tasks to be reordered", async () => {
      const router = await createRouter();
      const newList = await createList({ title: "Test" }, router);
      const task1 = await createTask(newList._id, { title: "Test 1" }, router);
      const task2 = await createTask(newList._id, { title: "Test 2" }, router);
      const task3 = await createTask(newList._id, { title: "Test 3" }, router);
      let list = await getLists(newList._id, {}, router);
      const sanitizeId = (task: any) => task._id.toString();
      expect(list.tasks.map(sanitizeId)).toMatchObject([task3, task2, task1].map(sanitizeId));
      list = await updateList(
        list._id,
        {
          tasks: [task1, task2, task3].map(sanitizeId)
        },
        router
      );
      list = await getLists(list._id, {}, router);
      expect(list.tasks.map(sanitizeId)).toMatchObject([task1, task2, task3].map(sanitizeId));
    });

    test("Prevents tasks from being injected during reorder", async () => {
      const router = await createRouter();
      const newList = await createList({ title: "Test" }, router);
      const task1 = await createTask(newList._id, { title: "Good Task" }, router);
      const task2 = await createTask(newList._id, { title: "Good Task" }, router);
      const badTask = await createTask(
        (await createList({ title: "Test" }, router))._id,
        { title: "Bad Task" },
        router
      );
      await expect(
        updateList(newList._id, { tasks: [badTask._id.toString(), task1._id.toString()] }, router)
      ).rejects.toThrow("Invalid modification of tasks");
      const list: List = await getLists(newList._id, {}, router);
      expect(list?.tasks).toHaveLength(2);
      expect(list?.tasks[1]._id).toMatchId(task1._id);
      expect(list?.tasks[0]._id).toMatchId(task2._id);
    });

    test("Prevents tasks from being removed during reorder", async () => {
      const router = await createRouter();
      const newList = await createList({ title: "Test" }, router);
      const task1 = (await createTask(newList._id, { title: "Good Task" }, router))._id;
      const task2 = (await createTask(newList._id, { title: "Good Task" }, router))._id;
      await expect(updateList(newList._id, { tasks: [task2] }, router)).rejects.toThrow(
        "Invalid modification of tasks"
      );
      const list = await getLists(newList._id, {}, router);
      expect(list?.tasks).toHaveLength(2);
      expect(list?.tasks[1]._id).toMatchId(task1._id);
      expect(list?.tasks[0]._id).toMatchId(task2._id);
    });

    test("Requires that the colour be a valid hex code", async () => {
      const router = await createRouter();
      const props = router;
      const badColors = ["red", "#SSSSSS"];
      const goodColors = ["#FFF", "#FF00AA"];
      for (const color of goodColors) {
        await createList({ title: "test", color }, props).then(list => expect(list.color).toBe(color));
      }
      for (const color of badColors) {
        await expect(createList({ title: "test", color }, props)).rejects.toThrow(/hex/);
      }
    });
  });

  describe("Lists Schema", () => {
    test("Requires the `owner` property to be set", async () => {
      const list = new Lists({
        title: "Test",
        owner: "invalid_id"
      });
      await expect(list.save()).rejects.toThrow("List validation failed: owner: Cast to ObjectId failed");
    });

    test(`Doesn't allow modification of the 'owners' property`, async () => {
      const list = await Lists.findOne({});
      if (!list) {
        return;
      }
      list.owner = "5b99d4d74a6df02dbddf9097"; // random valid id
      await expect(list.save()).rejects.toThrow("List validation failed: owner: Not permitted to modify owner!");
    });
  });
});
