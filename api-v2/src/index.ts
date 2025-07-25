import { Hono } from "hono";
import { serve } from "@hono/node-server";
import { cors } from "hono/cors";
import { auth } from "./auth.js"; // path to your auth file
import config from "./config.js";

const app = new Hono();

app.use(
  cors({
    origin: "http://localhost:4001", // Allow all origins, adjust as necessarym
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["POST", "GET", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
    credentials: true
  })
);
app.on(["POST", "GET"], "/api/auth/**", c => auth.handler(c.req.raw));

serve({
  port: config.PORT,
  ...app
});

console.log(config.PORT);
