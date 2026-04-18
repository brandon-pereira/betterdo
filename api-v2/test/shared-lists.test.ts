import { describe, test, expect } from "vitest";
import createRouter from "./helpers/createRouter.js";
import {
  getListById,
  getUserLists,
  createList,
  deleteList,
  updateListMembers,
  getListMembers,
  isUserAuthorizedToAccessList
} from "../src/services/lists.js";
import { createTask } from "../src/services/tasks.js";
import { testDb } from "./helpers/setup.js";
import { lists, listMembers } from "../src/schema/list.js";
import { tasks } from "../src/schema/task.js";
import { eq } from "drizzle-orm";

describe("Shared Lists", () => {
  describe("Adding members", () => {
    test("Allows members to be added via updateListMembers", async () => {
      const owner = await createRouter();
      const member = await createRouter();
      const list = await createList({ title: "Shared List", createdById: owner.user.id });

      await updateListMembers(list.id, [owner.user.id, member.user.id]);

      const fetched = await getListById({ userId: owner.user.id, listId: list.id });
      expect(fetched!.members).toHaveLength(2);
      expect(fetched!.members.map(m => m.id)).toEqual(
        expect.arrayContaining([owner.user.id, member.user.id])
      );
    });

    test("Added member gains access to the list", async () => {
      const owner = await createRouter();
      const member = await createRouter();
      const list = await createList({ title: "Shared List", createdById: owner.user.id });

      // Before: member cannot access
      expect(await getListById({ userId: member.user.id, listId: list.id })).toBeNull();
      expect(await isUserAuthorizedToAccessList({ userId: member.user.id, listId: list.id })).toBe(false);

      await updateListMembers(list.id, [owner.user.id, member.user.id]);

      // After: member can access
      const fetched = await getListById({ userId: member.user.id, listId: list.id });
      expect(fetched).not.toBeNull();
      expect(fetched!.id).toBe(list.id);
      expect(await isUserAuthorizedToAccessList({ userId: member.user.id, listId: list.id })).toBe(true);
    });

    test("Shared list appears in added member's list index", async () => {
      const owner = await createRouter();
      const member = await createRouter();
      const list = await createList({ title: "Shared List", createdById: owner.user.id });

      const listsBefore = await getUserLists({ userId: member.user.id });
      expect(listsBefore.map(l => l.id)).not.toContain(list.id);

      await updateListMembers(list.id, [owner.user.id, member.user.id]);

      const listsAfter = await getUserLists({ userId: member.user.id });
      expect(listsAfter.map(l => l.id)).toContain(list.id);
    });

    test("Allows adding multiple members at once", async () => {
      const owner = await createRouter();
      const member1 = await createRouter();
      const member2 = await createRouter();
      const member3 = await createRouter();
      const list = await createList({ title: "Team List", createdById: owner.user.id });

      await updateListMembers(list.id, [owner.user.id, member1.user.id, member2.user.id, member3.user.id]);

      const fetched = await getListById({ userId: owner.user.id, listId: list.id });
      expect(fetched!.members).toHaveLength(4);
    });

    test("No-op when members list is unchanged", async () => {
      const owner = await createRouter();
      const list = await createList({ title: "Stable List", createdById: owner.user.id });

      await updateListMembers(list.id, [owner.user.id]);

      const fetched = await getListById({ userId: owner.user.id, listId: list.id });
      expect(fetched!.members).toHaveLength(1);
      expect(fetched!.members[0].id).toBe(owner.user.id);
    });
  });

  describe("Removing members", () => {
    test("Allows members to be removed via updateListMembers", async () => {
      const owner = await createRouter();
      const member = await createRouter();
      const list = await createList({ title: "Shared List", createdById: owner.user.id });

      await updateListMembers(list.id, [owner.user.id, member.user.id]);
      await updateListMembers(list.id, [owner.user.id]);

      const fetched = await getListById({ userId: owner.user.id, listId: list.id });
      expect(fetched!.members).toHaveLength(1);
      expect(fetched!.members[0].id).toBe(owner.user.id);
    });

    test("Removed member loses access to the list", async () => {
      const owner = await createRouter();
      const member = await createRouter();
      const list = await createList({ title: "Shared List", createdById: owner.user.id });

      await updateListMembers(list.id, [owner.user.id, member.user.id]);
      expect(await getListById({ userId: member.user.id, listId: list.id })).not.toBeNull();

      await updateListMembers(list.id, [owner.user.id]);
      expect(await getListById({ userId: member.user.id, listId: list.id })).toBeNull();
      expect(await isUserAuthorizedToAccessList({ userId: member.user.id, listId: list.id })).toBe(false);
    });

    test("Shared list disappears from removed member's list index", async () => {
      const owner = await createRouter();
      const member = await createRouter();
      const list = await createList({ title: "Shared List", createdById: owner.user.id });

      await updateListMembers(list.id, [owner.user.id, member.user.id]);
      expect((await getUserLists({ userId: member.user.id })).map(l => l.id)).toContain(list.id);

      await updateListMembers(list.id, [owner.user.id]);
      expect((await getUserLists({ userId: member.user.id })).map(l => l.id)).not.toContain(list.id);
    });

    test("Prevents the owner from being removed", async () => {
      const owner = await createRouter();
      const member = await createRouter();
      const list = await createList({ title: "Shared List", createdById: owner.user.id });

      await updateListMembers(list.id, [owner.user.id, member.user.id]);

      await expect(updateListMembers(list.id, [member.user.id])).rejects.toThrow(
        "Cannot remove the owner from the list"
      );

      // Verify owner is still a member
      const fetched = await getListById({ userId: owner.user.id, listId: list.id });
      expect(fetched!.members).toHaveLength(2);
    });
  });

  describe("Ownership", () => {
    test("Returns correct owner on list detail", async () => {
      const owner = await createRouter();
      const list = await createList({ title: "Owned List", createdById: owner.user.id });
      const fetched = await getListById({ userId: owner.user.id, listId: list.id });
      expect(fetched!.owner).toBe(owner.user.id);
    });

    test("Owner is preserved when viewed by a member", async () => {
      const owner = await createRouter();
      const member = await createRouter();
      const list = await createList({ title: "Shared List", createdById: owner.user.id });
      await updateListMembers(list.id, [owner.user.id, member.user.id]);

      const fetched = await getListById({ userId: member.user.id, listId: list.id });
      expect(fetched!.owner).toBe(owner.user.id);
    });

    test("Owner is returned in list index", async () => {
      const owner = await createRouter();
      const member = await createRouter();
      const list = await createList({ title: "Shared List", createdById: owner.user.id });
      await updateListMembers(list.id, [owner.user.id, member.user.id]);

      const memberLists = await getUserLists({ userId: member.user.id });
      const sharedList = memberLists.find(l => l.id === list.id);
      expect(sharedList).toBeDefined();
      expect(sharedList!.createdById).toBe(owner.user.id);
    });
  });

  describe("Tasks on shared lists", () => {
    test("Members can see tasks on a shared list", async () => {
      const owner = await createRouter();
      const member = await createRouter();
      const list = await createList({ title: "Shared List", createdById: owner.user.id });
      await updateListMembers(list.id, [owner.user.id, member.user.id]);

      // Owner creates a task
      await createTask({
        title: "Shared task",
        listId: list.id,
        createdById: owner.user.id
      });

      // Member can see the task
      const fetched = await getListById({ userId: member.user.id, listId: list.id });
      expect(fetched!.tasks).toHaveLength(1);
      expect(fetched!.tasks[0].title).toBe("Shared task");
    });

    test("Members can add tasks to a shared list", async () => {
      const owner = await createRouter();
      const member = await createRouter();
      const list = await createList({ title: "Shared List", createdById: owner.user.id });
      await updateListMembers(list.id, [owner.user.id, member.user.id]);

      // Member creates a task
      await createTask({
        title: "Member's task",
        listId: list.id,
        createdById: member.user.id
      });

      // Owner can see the task
      const fetched = await getListById({ userId: owner.user.id, listId: list.id });
      expect(fetched!.tasks).toHaveLength(1);
      expect(fetched!.tasks[0].title).toBe("Member's task");
    });
  });

  describe("Deleting shared lists", () => {
    test("deleteList removes list and all member entries", async () => {
      const owner = await createRouter();
      const member = await createRouter();
      const list = await createList({ title: "To Delete", createdById: owner.user.id });
      await updateListMembers(list.id, [owner.user.id, member.user.id]);

      await deleteList(list.id);

      const fetchedList = await testDb.query.lists.findFirst({
        where: eq(lists.id, list.id)
      });
      expect(fetchedList).toBeUndefined();

      const members = await testDb.query.listMembers.findMany({
        where: eq(listMembers.listId, list.id)
      });
      expect(members).toHaveLength(0);
    });

    test("deleteList also removes tasks", async () => {
      const owner = await createRouter();
      const list = await createList({ title: "To Delete", createdById: owner.user.id });

      const [task] = await createTask({
        title: "Will be deleted",
        listId: list.id,
        createdById: owner.user.id
      });

      await deleteList(list.id);

      const fetchedTask = await testDb.query.tasks.findFirst({
        where: eq(tasks.id, task.id)
      });
      expect(fetchedTask).toBeUndefined();
    });

    test("Deleted shared list disappears from all members' list indexes", async () => {
      const owner = await createRouter();
      const member = await createRouter();
      const list = await createList({ title: "To Delete", createdById: owner.user.id });
      await updateListMembers(list.id, [owner.user.id, member.user.id]);

      await deleteList(list.id);

      const ownerLists = await getUserLists({ userId: owner.user.id });
      expect(ownerLists.map(l => l.id)).not.toContain(list.id);

      const memberLists = await getUserLists({ userId: member.user.id });
      expect(memberLists.map(l => l.id)).not.toContain(list.id);
    });
  });

  describe("Member data", () => {
    test("getListMembers returns sanitized member data", async () => {
      const owner = await createRouter();
      const list = await createList({ title: "Test Members", createdById: owner.user.id });

      const members = await getListMembers(list.id);
      expect(members).toHaveLength(1);
      expect(members[0]).toHaveProperty("id");
      expect(members[0]).toHaveProperty("email");
      expect(members[0]).toHaveProperty("firstName");
      expect(members[0]).toHaveProperty("profilePicture");
      // Should not leak internal fields
      expect(members[0]).not.toHaveProperty("name");
      expect(members[0]).not.toHaveProperty("emailVerified");
    });

    test("Members are returned with correct user details", async () => {
      const owner = await createRouter();
      const member = await createRouter();
      const list = await createList({ title: "Shared List", createdById: owner.user.id });
      await updateListMembers(list.id, [owner.user.id, member.user.id]);

      const fetched = await getListById({ userId: owner.user.id, listId: list.id });
      const memberData = fetched!.members.find(m => m.id === member.user.id);
      expect(memberData).toBeDefined();
      expect(memberData!.email).toBe(member.user.email);
      expect(memberData!.firstName).toBe(member.user.name.split(" ")[0]);
    });
  });
});
