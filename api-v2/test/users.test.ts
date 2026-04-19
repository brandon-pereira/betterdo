import { describe, test, expect, beforeAll, type Mock } from "vitest";
import createRouter, { RouterOptions } from "./helpers/createRouter.js";
import { testDb } from "./helpers/setup.js";
import { user, pushSubscriptions } from "../src/schema/auth.js";
import { getUserByEmail, updateUser } from "../src/services/users.js";
import { createList, getUserLists } from "../src/services/lists.js";
import { eq } from "drizzle-orm";
import type { Notifier } from "../src/notifier.js";

describe("Users", () => {
  describe("Schema", () => {
    test("Creates a user", async () => {
      const router = await createRouter();
      const result = await testDb.query.user.findFirst({
        where: (u, { eq }) => eq(u.id, router.user.id)
      });
      expect(result).toBeDefined();
      expect(result!.email).toBe(router.user.email);
      expect(result!.name).toBe("unitTest");
    });

    test("Throws error if missing required fields", async () => {
      await expect(
        testDb.insert(user).values({
          id: "missing-fields",
          name: undefined,
          email: "missing@test.com"
        })
      ).rejects.toThrow();
    });
  });

  describe("Controller", () => {
    let router: RouterOptions;

    beforeAll(async () => {
      router = await createRouter();
    });

    describe("getUser", () => {
      test("Allows finding users with valid email", async () => {
        const result = await getUserByEmail(router.user.email);
        expect(result).not.toBeNull();
        expect(result!.id).toBe(router.user.id);
        expect(result!.email).toBe(router.user.email);
        expect(result!.firstName).toBe("unitTest");
        expect(result!.profilePicture).toBeDefined();
      });

      test("Returns split name fields correctly", async () => {
        // Create a user with a full name
        const id = `user_fullname_${Date.now()}`;
        const email = `fullname-${Date.now()}@test.com`;
        await testDb.insert(user).values({
          id,
          name: "John Doe",
          email,
          emailVerified: false
        });

        const result = await getUserByEmail(email);
        expect(result).not.toBeNull();
        expect(result!.firstName).toBe("John");
        expect(result!.lastName).toBe("Doe");
      });

      test("Handles single-word name correctly", async () => {
        const result = await getUserByEmail(router.user.email);
        expect(result).not.toBeNull();
        expect(result!.firstName).toBe("unitTest");
        expect(result!.lastName).toBeUndefined();
      });

      test("Throws error finding users with invalid email", async () => {
        const result = await getUserByEmail("nonexistent@nowhere.com");
        expect(result).toBeNull();
      });
    });

    describe("updateUser", () => {
      test("Can be updated with valid data", async () => {
        const router = await createRouter();
        await updateUser({ firstName: "John" }, router);
        const userCache = await testDb.query.user.findFirst({
          where: eq(user.id, router.user.id)
        });
        expect(userCache?.name).toBe("John");
      });

      test("Allows global push subscription to be toggled", async () => {
        const router = await createRouter();
        let userCache = await testDb.query.user.findFirst({
          where: eq(user.id, router.user.id)
        });
        expect(userCache?.isPushEnabled).toBe(true);
        await updateUser({ isPushEnabled: false }, router);
        userCache = await testDb.query.user.findFirst({
          where: eq(user.id, router.user.id)
        });
        expect(userCache?.isPushEnabled).toBe(false);
      });

      test("Allows push subscriptions to be added", async () => {
        const router = await createRouter();
        let subs = await testDb.query.pushSubscriptions.findMany({
          where: eq(pushSubscriptions.userId, router.user.id)
        });
        expect(subs).toHaveLength(0);
        await updateUser({ pushSubscription: "test1" }, router);
        subs = await testDb.query.pushSubscriptions.findMany({
          where: eq(pushSubscriptions.userId, router.user.id)
        });
        expect(subs.map(s => s.endpoint)).toEqual(expect.arrayContaining(["test1"]));
        await updateUser({ pushSubscription: "test2" }, router);
        await updateUser({ pushSubscription: "test1" }, router); // duplicate, should not add
        subs = await testDb.query.pushSubscriptions.findMany({
          where: eq(pushSubscriptions.userId, router.user.id)
        });
        expect(subs.map(s => s.endpoint)).toEqual(expect.arrayContaining(["test1", "test2"]));
        const notifier = router.notifier.send as Mock<Notifier["send"]>;
        expect(notifier.mock.calls.length).toBe(2);
      });

      test("Allows custom lists to be modified", async () => {
        const router = await createRouter();
        await updateUser(
          {
            customLists: {
              tomorrow: true
            }
          },
          router
        );
        const userCache = await testDb.query.user.findFirst({
          where: eq(user.id, router.user.id)
        });
        expect(userCache?.customLists).toMatchObject({
          highPriority: false,
          today: false,
          tomorrow: true
        });
      });

      test("Allows users lists to be reordered", async () => {
        const router = await createRouter();
        const list1 = await createList({ title: "Test 1", createdById: router.user.id });
        const list2 = await createList({ title: "Test 2", createdById: router.user.id });
        const list3 = await createList({ title: "Test 3", createdById: router.user.id });
        const userLists = await getUserLists({ userId: router.user.id });
        const defaultLists = userLists.map(l => l.id);
        expect(defaultLists).toContain(list1.id);
        expect(defaultLists).toContain(list2.id);
        expect(defaultLists).toContain(list3.id);
        await updateUser(
          {
            lists: [list3.id, list2.id, list1.id]
          },
          router
        );
        const reorderedLists = await getUserLists({ userId: router.user.id });
        const nonInbox = reorderedLists.filter(l => l.type !== "inbox");
        expect(nonInbox.map(l => l.id)).toEqual([list3.id, list2.id, list1.id]);
      });

      test("Prevents lists from being injected during reorder", async () => {
        const userRequest1 = await createRouter();
        const userRequest2 = await createRouter();
        const list1 = await createList({ title: "Good", createdById: userRequest1.user.id });
        const list2 = await createList({ title: "Good", createdById: userRequest1.user.id });
        const list3 = await createList({ title: "BAD!", createdById: userRequest2.user.id });
        await expect(
          updateUser({ lists: [list1.id, list3.id] }, userRequest1)
        ).rejects.toThrow("Invalid modification of lists");
        const userLists = await getUserLists({ userId: userRequest1.user.id });
        const nonInbox = userLists.filter(l => l.type !== "inbox");
        expect(nonInbox).toHaveLength(2);
      });

      test("Prevents lists from being removed during reorder", async () => {
        const router = await createRouter();
        const list1 = await createList({ title: "Good", createdById: router.user.id });
        const list2 = await createList({ title: "Good", createdById: router.user.id });
        await expect(
          updateUser({ lists: [list2.id] }, router)
        ).rejects.toThrow("Invalid modification of lists");
        const userLists = await getUserLists({ userId: router.user.id });
        const nonInbox = userLists.filter(l => l.type !== "inbox");
        expect(nonInbox).toHaveLength(2);
      });
    });
  });
});
