import z from "zod";
import type { McpServer } from "@modelcontextprotocol/server";
import {
  createList,
  getListById,
  getListMembers,
  getUserLists,
  resolveListId,
  updateListDetails
} from "../../services/lists.js";
import { getAccountsCustomLists, isCustomList } from "../../services/customLists.js";
import {
  colorSchema,
  listIdSchema,
  listSummarySchema,
  listTitleSchema,
  toolError,
  toolResult,
  type ListSummary
} from "../schemas.js";
import type { McpContext } from "../context.js";

export function registerListTools(server: McpServer, { user }: McpContext) {
  server.registerTool(
    "get_lists",
    {
      title: "Get lists",
      description:
        "List all of the user's lists: their inbox, enabled smart lists (computed views such as Today or High " +
        "Priority), and their own and shared lists. Use the returned IDs with get_tasks.",
      outputSchema: z.object({ lists: z.array(listSummarySchema) }),
      annotations: { readOnlyHint: true, openWorldHint: false }
    },
    async () => {
      const [userLists, customLists] = await Promise.all([
        getUserLists({ userId: user.id }),
        getAccountsCustomLists({ user })
      ]);

      const summaries: ListSummary[] = await Promise.all(
        userLists.map(async list => ({
          id: list.id,
          title: list.title,
          type: list.type,
          color: list.color,
          incompleteTaskCount: list.tasks.length,
          completedTaskCount: list.additionalTasks,
          memberCount: (await getListMembers(list.id)).length
        }))
      );

      const smartLists: ListSummary[] = customLists.map(list => ({
        id: list.id,
        title: list.title,
        type: "smart",
        color: list.color,
        incompleteTaskCount: list.tasks.length,
        completedTaskCount: list.additionalTasks,
        memberCount: 1
      }));

      // Same ordering as the app sidebar: inbox, smart lists, then the rest.
      const inbox = summaries.filter(list => list.type === "inbox");
      const others = summaries.filter(list => list.type !== "inbox");
      return toolResult({ lists: [...inbox, ...smartLists, ...others] });
    }
  );

  server.registerTool(
    "create_list",
    {
      title: "Create list",
      description: "Create a new list owned by the user.",
      inputSchema: z.object({
        title: listTitleSchema,
        color: colorSchema.optional()
      }),
      outputSchema: listSummarySchema,
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false }
    },
    async ({ title, color }) => {
      const list = await createList({ title, color, createdById: user.id });
      return toolResult({
        id: list.id,
        title: list.title,
        type: list.type,
        color: list.color,
        incompleteTaskCount: 0,
        completedTaskCount: 0,
        memberCount: 1
      } satisfies ListSummary);
    }
  );

  server.registerTool(
    "update_list",
    {
      title: "Update list",
      description: "Rename a list or change its color. Smart lists cannot be modified.",
      inputSchema: z.object({
        listId: listIdSchema,
        title: listTitleSchema.optional(),
        color: colorSchema.optional()
      }),
      outputSchema: listSummarySchema,
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false }
    },
    async ({ listId: rawListId, title, color }) => {
      if (isCustomList(rawListId)) {
        return toolError(`"${rawListId}" is a smart list and cannot be modified.`);
      }
      if (title === undefined && color === undefined) {
        return toolError("Provide at least one of title or color to update.");
      }

      const listId = await resolveListId(user.id, rawListId);
      if (!(await getListById({ userId: user.id, listId }))) {
        return toolError(`List "${rawListId}" not found.`);
      }

      await updateListDetails(listId, { title, color });
      const list = await getListById({ userId: user.id, listId });
      if (!list) throw new Error("List disappeared during update");

      return toolResult({
        id: list.id,
        title: list.title,
        type: list.type,
        color: list.color,
        incompleteTaskCount: list.tasks.length,
        completedTaskCount: list.additionalTasks,
        memberCount: list.members.length
      } satisfies ListSummary);
    }
  );
}
