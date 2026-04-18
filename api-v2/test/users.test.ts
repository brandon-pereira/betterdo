import { describe, test, expect, beforeAll, type Mock } from "vitest";
import createRouter, { RouterOptions } from "./helpers/createRouter.js";
import { testDb } from "./helpers/setup.js";
import { user, pushSubscriptions } from "../src/schema/auth.js";
import { getUserByEmail, updateUser } from "../src/services/users.js";
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

      test.todo("Allows custom lists to be modified");
      test.todo("Allows users lists to be reordered");
      test.todo("Prevents lists from being injected during reorder");
      test.todo("Prevents lists from being removed during reorder");
      // Shared list membership tests are in shared-lists.test.ts
    });
  });
});
