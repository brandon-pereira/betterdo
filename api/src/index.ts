import { Hono } from "hono";
import { serve } from "@hono/node-server";
import { cors } from "hono/cors";
import { auth } from "./auth.js"; // path to your auth file
import config from "./config.js";
import listsApi from "./routes/lists.js";
import tasksApi from "./routes/tasks.js";
import usersApi from "./routes/users.js";
import configApi from "./routes/config.js";
import { getNotifier } from "./notifier.js";

// Last-resort guard: transient DB failures (e.g. Postgres not up yet when pm2
// starts the app) can surface as unhandled rejections from background timers
// like web-notifier's scheduler. Log instead of letting Node crash the process;
// the underlying pool reconnects and background pollers retry on their own.
process.on("unhandledRejection", reason => {
  console.error("[api] unhandledRejection:", reason instanceof Error ? reason.message : reason);
});

// Instantiate the push notifier once at startup so config issues surface early
// and the singleton is warm before the first request.
getNotifier();

const app = new Hono();

app.use(
  cors({
    origin: config.APP_URL,
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["POST", "GET", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
    credentials: true
  })
);

// Any error thrown from a route (including DB failures) lands here instead of
// crashing or hanging the request.
app.onError((err, c) => {
  console.error("[api]", err);
  return c.json({ error: "Internal server error" }, 500);
});

app.on(["POST", "GET"], "/api/auth/**", c => auth.handler(c.req.raw));

app.route("/api/lists", listsApi);
app.route("/api/tasks", tasksApi);
app.route("/api/users", usersApi);
app.route("/api/config", configApi);

serve({
  port: config.PORT,
  ...app
});

console.log(`API listening on ${config.SERVER_URL} (port ${config.PORT})`);
