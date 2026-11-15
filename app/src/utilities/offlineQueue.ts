import { MutationObserver } from "@tanstack/react-query";

import { queryClient } from "./queryClient";
import { createList, createTask, deleteTask, ServerError, updateList, updateTask } from "./server";

import type Task from "@customTypes/task";
import type { ServerList } from "@customTypes/list";

// Changes that can be made offline. Each one is applied to the cache right away
// by the calling hook, then queued here to be sent to the server. The queue is
// persisted with the cache, survives reloads, and replays in order once online.
interface QueuedChanges {
  createTask: { id: string; listId: string; title: string };
  updateTask: { taskId: string; updates: Partial<Task> };
  deleteTask: { taskId: string };
  createList: { id: string; title: string; color: string };
  updateList: { listId: string; updates: Partial<ServerList> };
}

// The task was deleted in the meantime (e.g. on another device), so there's
// nothing left to change.
async function ignoreNotFound(request: Promise<unknown>) {
  try {
    await request;
  } catch (err) {
    if (!(err instanceof ServerError && err.code === 404)) {
      throw err;
    }
  }
}

const senders: { [Key in keyof QueuedChanges]: (change: QueuedChanges[Key]) => Promise<unknown> } = {
  createTask: ({ id, listId, title }) => createTask(listId, title, id),
  updateTask: ({ taskId, updates }) => ignoreNotFound(updateTask(taskId, updates)),
  deleteTask: ({ taskId }) => ignoreNotFound(deleteTask(taskId)),
  createList: change => createList(change),
  updateList: ({ listId, updates }) => updateList(listId, updates)
};

// Registered up front (not per call) so changes restored after a reload can
// find their request function again; functions aren't persisted.
for (const key of Object.keys(senders) as (keyof QueuedChanges)[]) {
  queryClient.setMutationDefaults([key], {
    mutationFn: senders[key] as (change: unknown) => Promise<unknown>,
    // One shared scope sends changes one at a time in the order they were
    // made, so e.g. a task is created before it's edited.
    scope: { id: "offline-queue" }
  });
}

/**
 * Queues a change for the server. Resolves once it's sent, or as soon as it has
 * to wait (offline, or a request failed and will be retried), so callers don't
 * hang without a connection. Rejects if the server refuses the change.
 */
export function queueChange<Key extends keyof QueuedChanges>(key: Key, change: QueuedChanges[Key]): Promise<void> {
  const observer = new MutationObserver<unknown, Error, QueuedChanges[Key]>(queryClient, { mutationKey: [key] });
  return new Promise((resolve, reject) => {
    const unsubscribe = observer.subscribe(({ isPaused, failureCount }) => {
      if (isPaused || failureCount > 0) {
        unsubscribe();
        resolve();
      }
    });
    observer.mutate(change).then(
      () => {
        unsubscribe();
        resolve();
      },
      err => {
        unsubscribe();
        reject(err);
      }
    );
  });
}

/**
 * Starts sending changes restored from a previous session. Doesn't wait for
 * them: the restored data stays hidden until this returns, and offline the
 * changes can't be sent at all.
 */
export function resumeQueue() {
  // resumePausedMutations() alone would skip changes that were mid-request
  // when the app closed, since those were never marked as paused.
  for (const mutation of queryClient.getMutationCache().getAll()) {
    if (mutation.state.status === "pending") {
      mutation.continue().catch(() => {});
    }
  }
}
