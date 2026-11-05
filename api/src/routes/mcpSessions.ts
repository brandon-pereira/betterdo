import { Hono } from "hono";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import { listMcpSessions, revokeMcpSession } from "../services/mcpSessions.js";

const mcpSessionsApi = new Hono();

mcpSessionsApi.get("/", authMiddleware, async c => {
  const user = c.get("user");
  return c.json(await listMcpSessions(user.id));
});

mcpSessionsApi.delete("/:clientId", authMiddleware, async c => {
  const user = c.get("user");
  const revoked = await revokeMcpSession(user.id, c.req.param("clientId"));
  if (!revoked) {
    return c.json({ error: "MCP session not found" }, 404);
  }
  return c.json({ success: true });
});

export default mcpSessionsApi;
