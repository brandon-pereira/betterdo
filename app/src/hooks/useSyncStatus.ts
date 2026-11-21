import { useEffect, useState, useSyncExternalStore } from "react";
import { onlineManager, useIsMutating, useMutationState } from "@tanstack/react-query";

import { failedChangesStore, isNetworkError } from "@utilities/queryClient";

type SyncState = "idle" | "syncing" | "offline" | "failed";

const mutationFilters = { status: "pending" } as const;
const selectIsUnreachable = (mutation: { state: { failureReason: unknown } }) =>
  isNetworkError(mutation.state.failureReason);

const subscribeToOnline = (onChange: () => void) => onlineManager.subscribe(onChange);
const getIsOnline = () => onlineManager.isOnline();

// Most syncs finish quickly, so only show the spinner when one takes a while.
const SYNCING_DELAY_MS = 250;

function useSyncStatus() {
  const isOnline = useSyncExternalStore(subscribeToOnline, getIsOnline);
  const failedChanges = useSyncExternalStore(failedChangesStore.subscribe, failedChangesStore.get);
  const pendingChanges = useIsMutating();
  // Browsers only report offline when every network connection is down, so a
  // Mac with Wi-Fi off but Docker or a VPN still up says it's online. Changes
  // that can't reach the server keep retrying; treat that as offline too.
  const isUnreachable = useMutationState({ filters: mutationFilters, select: selectIsUnreachable }).some(Boolean);
  const isSending = isOnline && !isUnreachable && pendingChanges > 0;
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
  } else if (!isOnline || isUnreachable) {
    state = "offline";
  } else if (isSending && isSyncingVisible) {
    state = "syncing";
  }

  return { state, pendingChanges, failedChanges, dismissFailedChanges: failedChangesStore.clear };
}

export default useSyncStatus;
