import express, { Application } from "express";
import { Notifier } from "../notifier";
import { Database } from "../database";
import { getLists, createList, updateList, deleteList } from "../controllers/lists";
import { getTask, createTask, updateTask, deleteTask } from "../controllers/tasks";
import { updateUser, getCurrentUser, getUser } from "../controllers/users";
import routeHandler from "../helpers/routeHandler";

export default ({ db, notifier, app }: { app: Application; db: Database; notifier: Notifier }): void => {
  /* Initialize a router, anything behind `/api` requires authentication. */
  const api = express.Router();
  api.use("/", (req, res, next) => {
    if (req.user) {
      next();
    } else {
      res.status(401).json({
        error: "Authentication Required"
      });
    }
  });

  /**
   * Lists
   */
  api.get(["/lists", "/lists/:listId"], (req, res) =>
    routeHandler("getting lists", { req, res, db, notifier }, config =>
      getLists(
        req.params.listId,
        {
          includeCompleted: Boolean(req.query.includeCompleted === "true")
        },
        config
      )
    )
  );

  api.put("/lists", (req, res) =>
    routeHandler("create list", { req, res, db, notifier }, config => createList(req.body, config))
  );
  api.post("/lists/:listId", (req, res) =>
    routeHandler("update list", { req, res, db, notifier }, config => updateList(req.params.listId, req.body, config))
  );
  api.delete("/lists/:listId", (req, res) =>
    routeHandler("delete list", { req, res, db, notifier }, config => deleteList(req.params.listId, config))
  );

  /**
   * Tasks
   */
  api.put("/tasks", (req, res) =>
    routeHandler("adding task", { req, res, db, notifier }, config => {
      const listId = req.body.listId;
      delete req.body.listId;
      return createTask(listId, req.body, config);
    })
  );
  api.get("/tasks/:taskId", (req, res) =>
    routeHandler("getting task", { req, res, db, notifier }, config => getTask(req.params.taskId, config))
  );
  api.post("/tasks/:taskId", (req, res) =>
    routeHandler("updating task", { req, res, db, notifier }, config => updateTask(req.params.taskId, req.body, config))
  );
  api.delete("/tasks/:taskId", (req, res) =>
    routeHandler("deleting task", { req, res, db, notifier }, config => deleteTask(req.params.taskId, config))
  );

  /**
   * Users
   */
  api.get("/users/:email", (req, res) =>
    routeHandler("getting user by email", { req, res, db, notifier }, config => getUser(req.params.email, config))
  );
  api.get("/user", (req, res) =>
    routeHandler("getting current user", { req, res, db, notifier }, config => getCurrentUser(config))
  );
  api.post("/users", (req, res) =>
    routeHandler("updating user", { req, res, db, notifier }, config => updateUser(req.body, config))
  );

  /* Bind the api to the main server */
  app.use("/api", api);
};
