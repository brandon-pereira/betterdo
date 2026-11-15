import { SERVER_URL } from "@utilities/env";

export const getListsUrl = () => `${SERVER_URL}/api/lists`;

const INCLUDE_COMPLETED_QUERY = "?includeCompleted=true";

export const getListDetailUrl = (listId: string, includeCompleted?: boolean) =>
  `${SERVER_URL}/api/lists/${listId}${includeCompleted ? INCLUDE_COMPLETED_QUERY : ""}`;

/** Both cached variants of a list: with and without its completed tasks. */
export const getListDetailUrls = (listId: string) => [getListDetailUrl(listId), getListDetailUrl(listId, true)];

export const isListDetailUrl = (url: string) => url.startsWith(getListDetailUrl(""));

export const isListDetailUrlWithCompleted = (url: string) => url.endsWith(INCLUDE_COMPLETED_QUERY);

export const getTaskDetailUrl = (taskId: string) => `${SERVER_URL}/api/tasks/${taskId}`;

export const getConfigUrl = () => `${SERVER_URL}/api/config`;

export const getConnectedAppsUrl = () => `${SERVER_URL}/api/mcp-sessions`;

export const getWrappedUrl = () => `${SERVER_URL}/api/wrapped`;
