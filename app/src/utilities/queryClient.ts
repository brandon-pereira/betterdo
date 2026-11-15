import { MutationCache, onlineManager, QueryClient } from "@tanstack/react-query";
import type { Mutation } from "@tanstack/react-query";
import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister";
import { del, get, set } from "idb-keyval";

import { FetchError, fetcher } from "./fetcher";
import { ServerError } from "./server";

// Long enough to survive a trip without a connection. Queued changes are
// persisted alongside the cache, so anything older than this is dropped too.
// Must stay under setTimeout's ~24.8 day limit, or cached data that isn't on
// screen is garbage collected immediately.
const MAX_CACHE_AGE = 1000 * 60 * 60 * 24 * 21;
// Bump only when the cached data shape changes; it discards queued changes too.
const CACHE_VERSION = "1";

// fetch() rejects with a TypeError when the request never reached the server
// (offline, DNS failure, captive portal), which is always worth retrying.
function isNetworkError(error: unknown) {
  return error instanceof TypeError || (error instanceof ServerError && error.originalError instanceof TypeError);
}

function getStatus(error: unknown) {
  if (error instanceof FetchError) {
    return error.status;
  }
  return error instanceof ServerError ? error.code : undefined;
}

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
    },
    onSettled: () => {
      // The settling mutation still counts here, so 1 means it was the last one.
      if (queryClient.isMutating() === 1) {
        queryClient.invalidateQueries();
      }
    }
  })
});

const persister = createAsyncStoragePersister({
  storage: { getItem: get, setItem: set, removeItem: del },
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
  queryClient.clear();
  await persister.removeClient();
}
