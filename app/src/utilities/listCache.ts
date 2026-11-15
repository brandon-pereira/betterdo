import type { QueryKey } from "@tanstack/react-query";

import { queryClient } from "./queryClient";

import { getListDetailUrl, getListsUrl, getTaskDetailUrl } from "@hooks/internal/urls";
import type List from "@customTypes/list";
import type Task from "@customTypes/task";

// Helpers that apply a change to every cached copy of the data, so the app
// shows it immediately, including offline. The server's version replaces these
// once queued changes have been sent and the queries refresh.

type ListDetail = Partial<List>;

const listDetailPrefix = getListDetailUrl("");

const includesCompleted = (queryKey: QueryKey) => String(queryKey[0]).includes("includeCompleted=true");

// A list is cached once per "show completed tasks" setting, and smart lists
// (Today, High Priority, ...) hold copies of tasks from other lists.
function updateListDetails(updater: (list: ListDetail, includesCompleted: boolean, url: string) => ListDetail) {
  const queries = queryClient
    .getQueryCache()
    .findAll({ predicate: query => String(query.queryKey[0]).startsWith(listDetailPrefix) });
  for (const { queryKey } of queries) {
    const url = String(queryKey[0]);
    queryClient.setQueryData<ListDetail>(queryKey, list => list && updater(list, includesCompleted(queryKey), url));
  }
}

const isRealList = (list: ListDetail) => list.type === "default" || list.type === "inbox";

function findTask(taskId: string): Task | undefined {
  const cached = queryClient.getQueryData<Task>([getTaskDetailUrl(taskId)]);
  if (cached) {
    return cached;
  }
  for (const [, list] of queryClient.getQueriesData<ListDetail>({
    predicate: query => String(query.queryKey[0]).startsWith(listDetailPrefix)
  })) {
    const task = [...(list?.tasks ?? []), ...(list?.completedTasks ?? [])].find(t => t.id === taskId);
    if (task) {
      return task;
    }
  }
}

/** Adds a new task to the top of a list. The task detail is seeded too, so it can be edited offline. */
export function addTask(listId: string, task: Task) {
  for (const key of [getListDetailUrl(listId), getListDetailUrl(listId, true)]) {
    queryClient.setQueryData<ListDetail>([key], list => list && { ...list, tasks: [task, ...(list.tasks ?? [])] });
  }
  queryClient.setQueryData<Task>([getTaskDetailUrl(task.id)], task);
}

export function patchTask(taskId: string, updates: Partial<Task>) {
  const patch = (tasks?: Task[]) => tasks?.map(task => (task.id === taskId ? { ...task, ...updates } : task));
  updateListDetails(list => ({ ...list, tasks: patch(list.tasks), completedTasks: patch(list.completedTasks) }));
  queryClient.setQueryData<Task>([getTaskDetailUrl(taskId)], task => task && { ...task, ...updates });
}

/** Moves a task between the open and completed sections, like the server does once it saves. */
export function moveTaskToSection(taskId: string, isCompleted: boolean) {
  updateListDetails((list, hasCompleted) => {
    const from = isCompleted ? list.tasks : list.completedTasks;
    const task = from?.find(t => t.id === taskId);
    if (!task) {
      return list;
    }
    const remaining = from!.filter(t => t.id !== taskId);
    if (!isCompleted) {
      return { ...list, completedTasks: remaining, tasks: [task, ...(list.tasks ?? [])] };
    }
    return hasCompleted
      ? { ...list, tasks: remaining, completedTasks: [task, ...(list.completedTasks ?? [])] }
      : { ...list, tasks: remaining, additionalTasks: (list.additionalTasks ?? 0) + 1 };
  });
}

/** Moves a task to another list. Smart lists keep their copy since they span lists. */
export function moveTaskToList(taskId: string, toListId: string) {
  const task = findTask(taskId);
  updateListDetails(list => {
    if (!isRealList(list)) {
      return list;
    }
    const tasks = list.tasks ?? [];
    const hasTask = tasks.some(t => t.id === taskId);
    if (list.id === toListId) {
      return hasTask || !task ? list : { ...list, tasks: [{ ...task, listId: toListId }, ...tasks] };
    }
    return hasTask ? { ...list, tasks: tasks.filter(t => t.id !== taskId) } : list;
  });
}

export function removeTask(taskId: string) {
  updateListDetails(list => ({
    ...list,
    tasks: list.tasks?.filter(t => t.id !== taskId),
    completedTasks: list.completedTasks?.filter(t => t.id !== taskId)
  }));
  queryClient.removeQueries({ queryKey: [getTaskDetailUrl(taskId)], exact: true });
}

/**
 * Applies list changes (title, color, task order, ...) to the list and the sidebar.
 * `listId` may also be the "inbox" slug the inbox is opened with.
 */
export function patchList(listId: string, updates: ListDetail) {
  const urls = [getListDetailUrl(listId), getListDetailUrl(listId, true)];
  const matches = (list: ListDetail) => list.id === listId || (listId === "inbox" && list.type === "inbox");
  updateListDetails((list, _hasCompleted, url) =>
    matches(list) || urls.includes(url) ? { ...list, ...updates } : list
  );
  // The sidebar holds task ids rather than tasks, so only list fields apply there.
  const sidebarUpdates = { ...updates };
  delete sidebarUpdates.tasks;
  queryClient.setQueryData<List[]>(
    [getListsUrl()],
    lists => lists && lists.map(list => (matches(list) ? { ...list, ...sidebarUpdates } : list))
  );
}

/** Adds a new list to the sidebar and seeds its (empty) detail so it opens offline. */
export function addList(list: List) {
  queryClient.setQueryData<List[]>([getListsUrl()], lists => [...(lists ?? []), list]);
  queryClient.setQueryData<ListDetail>([getListDetailUrl(list.id)], {
    ...list,
    completedTasks: [],
    additionalTasks: 0
  });
}
