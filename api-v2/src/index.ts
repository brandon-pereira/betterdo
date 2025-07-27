import { Hono } from "hono";
import { serve } from "@hono/node-server";
import { cors } from "hono/cors";
import { auth } from "./auth.js"; // path to your auth file
import config from "./config.js";
import listsApi from "./routes/lists.js";
import tasksApi from "./routes/tasks.js";

const app = new Hono();

app.use(
  cors({
    origin: "http://localhost:4001", // Allow all origins, adjust as necessarym
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["POST", "GET", "PUT", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
    credentials: true
  })
);
app.on(["POST", "GET"], "/api/auth/**", c => auth.handler(c.req.raw));

app.route("/api/lists", listsApi);
app.route("/api/tasks", tasksApi);

serve({
  port: config.PORT,
  ...app
});

console.log(config.PORT);
