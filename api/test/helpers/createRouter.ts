import { vi } from "vitest";
import { testDb } from "./setup.js";
import { user } from "../../src/schema/auth.js";
import { lists, listMembers } from "../../src/schema/list.js";
import type { Notifier } from "../../src/notifier.js";

interface SessionUser {
  id: string;
  email: string;
  name: string;
  image: string | null;
  timeZone: string;
  customLists?: Record<string, boolean> | null;
}

export interface RouterOptions {
  user: SessionUser;
  notifier: Notifier;
}

const createMockedNotifier = () =>
  ({
    send: vi.fn(),
    schedule: vi.fn()
  }) as unknown as Notifier;

const createUser = async (): Promise<SessionUser> => {
  const id = `user_${Date.now()}_${Math.random().toString(36).slice(2)}`;
  const email = `${Date.now()}-${Math.random()}@unitTests.com`;

  const [newUser] = await testDb
    .insert(user)
    .values({
      id,
      name: "unitTest",
      email,
      emailVerified: false,
      timeZone: "America/Edmonton",
      customLists: { highPriority: false, today: false },
      isPushEnabled: true
    })
    .returning();

  // Create inbox for the user
  const [inbox] = await testDb
    .insert(lists)
    .values({
      title: "Inbox",
      type: "inbox",
      createdById: newUser.id
    })
    .returning();

  await testDb.insert(listMembers).values({
    listId: inbox.id,
    userId: newUser.id
  });

  return {
    id: newUser.id,
    email: newUser.email,
    name: newUser.name,
    image: newUser.image,
    timeZone: newUser.timeZone,
    customLists: newUser.customLists as Record<string, boolean> | null
  };
};

const createRouter = async (): Promise<RouterOptions> => {
  const _user = await createUser();
  return {
    user: _user,
    notifier: createMockedNotifier()
  };
};

export default createRouter;
