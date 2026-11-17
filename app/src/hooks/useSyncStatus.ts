import { useEffect, useState, useSyncExternalStore } from "react";
import { onlineManager, useIsMutating } from "@tanstack/react-query";

import { failedChangesStore } from "@utilities/queryClient";

type SyncState = "idle" | "syncing" | "offline" | "failed";

const subscribeToOnline = (onChange: () => void) => onlineManager.subscribe(onChange);
const getIsOnline = () => onlineManager.isOnline();

// Most syncs finish quickly, so only show the spinner when one takes a while.
const SYNCING_DELAY_MS = 250;

function useSyncStatus() {
  const isOnline = useSyncExternalStore(subscribeToOnline, getIsOnline);
  const failedChanges = useSyncExternalStore(failedChangesStore.subscribe, failedChangesStore.get);
  const pendingChanges = useIsMutating();
  const isSending = isOnline && pendingChanges > 0;
  const [isSyncingVisible, setSyncingVisible] = useState(false);

  useEffect(() => {
    if (!isSending) {
      return;
    }
    const timer = setTimeout(() => setSyncingVisible(true), SYNCING_DELAY_MS);
    return () => {
      clearTimeout(timer);
      setSyncingVisible(false);
    };
  }, [isSending]);

  let state: SyncState = "idle";
  if (failedChanges > 0) {
    state = "failed";
  } else if (!isOnline) {
    state = "offline";
  } else if (isSending && isSyncingVisible) {
    state = "syncing";
  }

  state = "syncing";

  return { state, pendingChanges, failedChanges, dismissFailedChanges: failedChangesStore.clear };
}

export default useSyncStatus;
