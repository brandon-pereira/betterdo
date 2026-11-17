import { MutationCache, onlineManager, QueryClient } from "@tanstack/react-query";
import type { Mutation } from "@tanstack/react-query";
import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister";
import { del, get, set } from "idb-keyval";

import { fetcher } from "./fetcher";
import { ServerError } from "./server";

// Long enough to survive a trip without a connection. Queued changes are
// persisted alongside the cache, so anything older than this is dropped too.
const MAX_CACHE_AGE = 1000 * 60 * 60 * 24 * 7; // 7 days
// Bump only when the cached data shape changes; it discards queued changes too.
const CACHE_VERSION = "1";

// fetch() rejects with a TypeError when the request never reached the server
// (offline, DNS failure, captive portal), which is always worth retrying.
function isNetworkError(error: unknown) {
  return error instanceof TypeError || (error instanceof ServerError && error.originalError instanceof TypeError);
}

const getStatus = (error: unknown) => (error instanceof ServerError ? error.code : undefined);

function shouldRetry(failureCount: number, error: unknown) {
  if (isNetworkError(error)) {
    return true;
  }
  const status = getStatus(error);
  return status !== undefined && status >= 500 && failureCount < 3;
}

// Queued changes keep retrying through an expired session (the app sends the
// user to sign in), so they replay after signing back in instead of being lost.
function shouldRetryQueued(failureCount: number, error: unknown) {
  return getStatus(error) === 401 || shouldRetry(failureCount, error);
}

// TanStack assumes it's online until the browser fires an "offline" event,
// which never happens when the app is opened without a connection.
onlineManager.setOnline(navigator.onLine);

// Changes the server refused for good. Their local edits are undone when the
// queue refreshes, so the count is kept until the user dismisses it.
let failedChanges = 0;
const failedChangesListeners = new Set<() => void>();

function setFailedChanges(count: number) {
  failedChanges = count;
  failedChangesListeners.forEach(listener => listener());
}

export const failedChangesStore = {
  subscribe(listener: () => void) {
    failedChangesListeners.add(listener);
    return () => failedChangesListeners.delete(listener);
  },
  get: () => failedChanges,
  clear: () => setFailedChanges(0)
};

/** True when no local changes are waiting to reach the server. */
export function isQueueIdle() {
  return queryClient.isMutating() === 0;
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: ({ queryKey }) => fetcher(queryKey[0] as string),
      gcTime: MAX_CACHE_AGE,
      retry: shouldRetry,
      // Refetching while changes are queued would briefly replace them with
      // older server data. The queue refreshes everything once it drains.
      refetchOnMount: isQueueIdle,
      refetchOnWindowFocus: isQueueIdle,
      refetchOnReconnect: isQueueIdle
    },
    mutations: {
      retry: shouldRetryQueued
    }
  },
  mutationCache: new MutationCache({
    onError: error => {
      console.error("[app] Failed to sync a change", error);
      setFailedChanges(failedChanges + 1);
    },
    onSettled: () => {
      // The settling mutation still counts here, so 1 means it was the last one.
      if (queryClient.isMutating() === 1) {
        queryClient.invalidateQueries();
      }
    }
  })
});

// Set while signing out, so a save already under way can't write the cache back
// after it was deleted. The reload after sign out resets it.
let isClearing = false;

const persister = createAsyncStoragePersister({
  storage: {
    getItem: get,
    setItem: (key, value) => (isClearing ? Promise.resolve() : set(key, value)),
    removeItem: del
  },
  key: "betterdo-query-cache",
  // Keep this short so a change made right before closing the app is saved.
  throttleTime: 250
});

export const persistOptions = {
  persister,
  maxAge: MAX_CACHE_AGE,
  buster: CACHE_VERSION,
  dehydrateOptions: {
    // The default only keeps paused mutations, which would drop a change that
    // was mid-request when the app closed.
    shouldDehydrateMutation: (mutation: Mutation) => mutation.state.status === "pending"
  }
};

/** Wipes cached data and queued changes, e.g. on sign out. */
export async function clearQueryCache() {
  isClearing = true;
  queryClient.clear();
  await persister.removeClient();
}
