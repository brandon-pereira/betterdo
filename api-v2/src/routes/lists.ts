import { Hono } from "hono";
import {
  createList,
  deleteList,
  getListById,
  getListMembers,
  getUserInbox,
  getUserLists,
  updateListMembers
} from "../services/lists.js";
import { getAccountsCustomLists, getCustomListById, isCustomList } from "../services/customLists.js";
import { lists } from "../schema/list.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import { zValidator } from "@hono/zod-validator";
import { db } from "../db.js";
import { createListSchema, updateListSchema } from "../validators/lists.js";
import { eq } from "drizzle-orm";

const listsApi = new Hono();

listsApi.get("/", authMiddleware, async c => {
  const user = c.get("user");

  const [userLists, customLists] = await Promise.all([
    getUserLists({ userId: user.id }),
    getAccountsCustomLists({ user })
  ]);

  const hydratedUserLists = await Promise.all(
    userLists.map(async list => ({
      ...list,
      tasks: [],
      completedTasks: [],
      additionalTasks: 0,
      members: await getListMembers(list.id),
      owner: list.createdById
    }))
  );

  const inbox = hydratedUserLists.find(list => list.type === "inbox");
  const defaultLists = hydratedUserLists.filter(list => list.type !== "inbox");

  return c.json([...(inbox ? [inbox] : []), ...customLists, ...defaultLists]);
});

listsApi.get("/:id", authMiddleware, async c => {
  const user = c.get("user");
  let listId = c.req.param("id");
  const includeCompleted = c.req.query("includeCompleted") === "true";

  if (isCustomList(listId)) {
    const list = await getCustomListById(listId, includeCompleted, { user });
    if (!list) {
      return c.json({ error: "No list found" }, 404);
    }
    return c.json(list);
  }

  // Resolve "inbox" to the user's actual inbox list UUID
  if (listId === "inbox") {
    const inbox = await getUserInbox(user.id);
    if (!inbox) {
      return c.json({ error: "No list found" }, 404);
    }
    listId = inbox.id;
  }

  const list = await getListById({ userId: user.id, listId });
  if (!list) {
    return c.json({ error: "No list found" }, 404);
  }
  return c.json(list);
});

listsApi.put("/", authMiddleware, zValidator("json", createListSchema), async c => {
  const user = c.get("user");
  const payload = c.req.valid("json");
  const newList = await createList({
    ...payload,
    createdById: user.id
  });
  return c.json(newList);
});

listsApi.post("/:id", authMiddleware, zValidator("json", updateListSchema), async c => {
  const user = c.get("user");
  const listId = c.req.param("id");
  const list = await getListById({ userId: user.id, listId });
  if (!list) {
    return c.json({ error: "No list found" }, 404);
  }

  const { members, ...listProps } = c.req.valid("json");

  // Update list properties (title, color, etc.) if any were provided
  if (Object.keys(listProps).length > 0) {
    await db
      .update(lists)
      .set(listProps)
      .where(eq(lists.id, listId));
  }

  // Update members if provided
  if (members) {
    try {
      await updateListMembers(listId, members);
    } catch (err) {
      if (err instanceof Error && err.message === "Cannot remove the owner from the list") {
        return c.json({ error: err.message }, 403);
      }
      throw err;
    }
  }

  // Return the updated list with full details
  const updatedList = await getListById({ userId: user.id, listId });
  return c.json(updatedList);
});

listsApi.delete("/:id", authMiddleware, async c => {
  const user = c.get("user");
  const listId = c.req.param("id");
  const list = await getListById({ userId: user.id, listId });
  if (!list) {
    return c.json({ error: "No list found" }, 404);
  }
  await deleteList(listId);
  return c.json({ success: true });
});

export default listsApi;
