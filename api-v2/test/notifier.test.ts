import { describe, test } from "vitest";

// TODO: Port these tests once v2 has a notification system.
// The v1 notifier handles push notifications for shared list events:
// - User push subscription management
// - Task creation/completion/update/deletion in shared lists
// The v2 API does not yet have a notifier service.

describe("Notifier", () => {
  describe("User", () => {
    test.todo("tweaks user.isPushEnabled");
    test.todo("tweaks user.pushSubscription");
  });

  describe("Shared List", () => {
    test.todo("adds task");
    test.todo("marks task completed");
    test.todo("updates task");
    test.todo("deletes task");
  });
});
