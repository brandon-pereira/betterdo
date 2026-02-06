import { Hono } from "hono";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import { createTask, getTaskById, updateTask } from "../services/tasks.js";
import { createTaskSchema, updateTaskSchema } from "../validators/tasks.js";
import { zValidator } from "@hono/zod-validator";
import { isUserAuthorizedToAccessList } from "../services/lists.js";
import z from "zod";

const tasksApi = new Hono();

tasksApi.get("/:id", authMiddleware, async c => {
  const taskId = c.req.param("id");
  const task = await getTaskById(taskId);
  if (!task) {
    return c.json({ error: "Task not found" }, 404);
  }
  if (
    !(await isUserAuthorizedToAccessList({
      userId: c.get("user").id,
      listId: task.listId
    }))
  ) {
    return c.json({ error: "Unauthorized access to this task" }, 403);
  }
  return c.json({
    ...task
  });
});

tasksApi.put(
  "/",
  authMiddleware,
  zValidator("json", createTaskSchema, (result, c) => {
    if (!result.success) {
      return c.json({
        error: "Invalid request data",
        result: z.prettifyError(result.error)
      });
    }
  }),
  async c => {
    const user = c.get("user");
    const payload = c.req.valid("json");
    const newList = await createTask({
      ...payload,
      createdById: user.id
    });
    return c.json(newList);
  }
);

tasksApi.post(
  "/:taskId",
  authMiddleware,
  zValidator("json", updateTaskSchema, (result, c) => {
    if (!result.success) {
      return c.json(
        {
          error: "Invalid request data",
          formattedMessage: z.prettifyError(result.error)
        },
        400
      );
    }
  }),
  async c => {
    const user = c.get("user");
    const payload = c.req.valid("json");
    const task = await getTaskById(c.req.param("taskId"));
    if (!task) {
      return c.json({ error: "Task not found" }, 404);
    }
    const isAuthorized = await isUserAuthorizedToAccessList({
      userId: user.id,
      listId: task.listId
    });
    if (!isAuthorized) {
      return c.json({ error: "Unauthorized access to this task" }, 403);
    }
    const newTask = await updateTask(c.req.param("taskId"), {
      ...payload
    });
    return c.json(newTask);
  }
);

export default tasksApi;
