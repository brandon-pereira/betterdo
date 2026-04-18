import { describe, test } from "vitest";

// TODO: Port these tests once v2 has a user controller/service equivalent.
// The v1 user controller handles: getUser, getCurrentUser, updateUser
// including push subscriptions, custom lists, list reordering, and
// shared list membership. The v2 API currently relies on better-auth
// for user management and doesn't expose equivalent controller functions.

describe("Users", () => {
  describe("Schema", () => {
    test.todo("Creates a user");
    test.todo("Throws error if missing required fields");
  });

  describe("Controller", () => {
    describe("getUser", () => {
      test.todo("Allows finding users with valid email");
      test.todo("Allows finding current user");
      test.todo("Throws error finding users with invalid email");
    });

    describe("updateUser", () => {
      test.todo("Can be updated with valid data");
      test.todo("Allows global push subscription to be toggled");
      test.todo("Allows push subscriptions to be added");
      test.todo("Allows custom lists to be modified");
      test.todo("Allows users lists to be reordered");
      test.todo("Prevents lists from being injected during reorder");
      test.todo("Prevents lists from being removed during reorder");
      test.todo("Allows members to be added to shared lists");
      test.todo("Allows members to be removed from shared lists");
    });
  });
});
