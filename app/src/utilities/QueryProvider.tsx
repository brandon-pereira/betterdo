import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";

import { persistOptions, queryClient } from "./queryClient";
import { resumeQueue } from "./offlineQueue";

// Restores cached data and queued changes from IndexedDB before queries run, so
// the app opens with the last known data even without a connection.
function QueryProvider({ children }: { children: React.ReactNode }) {
  return (
    <PersistQueryClientProvider client={queryClient} persistOptions={persistOptions} onSuccess={resumeQueue}>
      {children}
    </PersistQueryClientProvider>
  );
}

export default QueryProvider;
