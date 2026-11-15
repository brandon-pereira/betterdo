import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";

import { isQueueIdle, persistOptions, queryClient } from "./queryClient";
import { resumeQueue } from "./offlineQueue";
import { prefetchInitialData } from "./prefetch";

function onRestored() {
  // With changes still queued, the server's data would hide them until they're
  // sent. The queue refreshes everything once it drains.
  if (isQueueIdle()) {
    prefetchInitialData();
  }
  resumeQueue();
}

// Restores cached data and queued changes from IndexedDB before queries run, so
// the app opens with the last known data even without a connection.
function QueryProvider({ children }: { children: React.ReactNode }) {
  return (
    <PersistQueryClientProvider client={queryClient} persistOptions={persistOptions} onSuccess={onRestored}>
      {children}
    </PersistQueryClientProvider>
  );
}

export default QueryProvider;
