import { Hono } from "hono";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import { db } from "../db.js";
import { tasks } from "../schema/task.js";
import getTasks from "../services/tasks.js";

const tasksApi = new Hono();

tasksApi.get("/", authMiddleware, async c => {
  const user = c.get("user");
  console.log("Fetching tasks for user:", user);

  const tasks = await getTasks({ userId: user.id });

  // if (!tasks) {
  //   return c.json({ error: "No tasks found" }, 404);
  // }
  console.log("Tasks fetched:", tasks);
  return c.json(
    tasks.map(task => ({
      ...task,
      // TODO: Remove this and handle id conversion in the frontend
      _id: task.id
    }))
  );
});

tasksApi.get("/:id", c => {
  // GET /book/:id
  const id = c.req.param("id");
  return c.text("Get Book: " + id);
});

tasksApi.put("/", authMiddleware, async c => {
  const user = c.get("user");
  const listData = await c.req.json();
  console.log("Creating list for user:", user, "with data:", listData);

  // Here you would typically call a service to create the list
  // const newList = await createList({ ...listData, createdById: user.id });
  const newTask = await db
    .insert(tasks)
    .values({
      ...listData,
      ownerId: user.id
    })
    .returning();

  // For now, let's just return the data back
  return c.json({ ...newTask[0] });
});

export default tasksApi;
