import { Badge, Dot } from "./SyncStatus.styles";

import useSyncStatus from "@hooks/useSyncStatus";

// Hidden while online with nothing to send, so it only appears when it matters.
function SyncStatus() {
  const { isOnline, pendingChanges } = useSyncStatus();

  if (isOnline && pendingChanges === 0) {
    return null;
  }

  const changes = `${pendingChanges} ${pendingChanges === 1 ? "change" : "changes"}`;
  const label = isOnline ? "Syncing" : "Offline";
  const description = isOnline
    ? `Sending ${changes}`
    : pendingChanges > 0
      ? `You're offline. ${changes} will sync when you reconnect.`
      : "You're offline. Changes will sync when you reconnect.";

  return (
    <Badge role="status" title={description} aria-label={description}>
      <Dot data-offline={isOnline ? "false" : "true"} />
      {label}
      {pendingChanges > 0 && ` · ${pendingChanges}`}
    </Badge>
  );
}

export default SyncStatus;
