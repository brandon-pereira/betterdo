import { McpServer } from "@modelcontextprotocol/server";
import { registerListTools } from "./tools/lists.js";
import { registerTaskTools } from "./tools/tasks.js";
import { todayForTimeZone } from "../utils/dueDate.js";
import type { McpContext } from "./context.js";

// Built fresh for every HTTP request (see routes/mcp.ts), so it must stay cheap
// and hold no state of its own. Everything is scoped to `context.user`.
export function createBetterDoMcpServer(context: McpContext) {
  const { timeZone } = context.user;

  const server = new McpServer(
    { name: "betterdo", title: "BetterDo", version: "1.0.0" },
    {
      instructions: [
        "BetterDo is a todo list app. Each user has an inbox, their own lists, and lists shared with them.",
        'Smart lists ("today", "tomorrow", "overdue", "week", "highPriority") are read-only views computed across all lists.',
        "Tasks and lists cannot be deleted through these tools. Mark tasks completed instead, which removes them from the default view. The user can permanently delete tasks and lists in the BetterDo app.",
        `Dates are calendar dates (YYYY-MM-DD) in the user's timezone (${timeZone}). Today is ${todayForTimeZone(timeZone)}.`
      ].join("\n"),
      maxToolInputElements: 1_000
    }
  );

  registerListTools(server, context);
  registerTaskTools(server, context);

  return server;
}
