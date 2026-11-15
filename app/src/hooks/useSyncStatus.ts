import { useSyncExternalStore } from "react";
import { onlineManager, useIsMutating } from "@tanstack/react-query";

const subscribe = (onChange: () => void) => onlineManager.subscribe(onChange);
const getIsOnline = () => onlineManager.isOnline();

function useSyncStatus() {
  const isOnline = useSyncExternalStore(subscribe, getIsOnline);
  const pendingChanges = useIsMutating();
  return { isOnline, pendingChanges };
}

export default useSyncStatus;
