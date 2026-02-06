import { Hono } from "hono";
import { createList, getListById, getUserLists } from "../services/lists.js";
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

  const hydratedUserLists = userLists.map(list => ({
    ...list,
    tasks: [],
    completedTasks: [],
    additionalTasks: 0,
    members: [],
    owner: user.id
  }));

  return c.json([...hydratedUserLists, ...customLists]);
});

listsApi.get("/:id", authMiddleware, async c => {
  const user = c.get("user");
  const listId = c.req.param("id");
  const includeCompleted = c.req.query("includeCompleted") === "true";

  if (isCustomList(listId)) {
    const list = await getCustomListById(listId, includeCompleted, { user });
    if (!list) {
      return c.json({ error: "No list found" }, 404);
    }
    return c.json(list);
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
  const updatedList = await db
    .update(lists)
    .set({ ...c.req.valid("json") })
    .where(eq(lists.id, listId))
    .returning();
  return c.json(updatedList[0]);
});

export default listsApi;
