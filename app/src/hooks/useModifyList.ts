import { useCallback } from "react";

import List, { ServerList } from "@customTypes/list";
import { patchList } from "@utilities/listCache";
import { queueChange } from "@utilities/offlineQueue";

function useModifyList() {
  return useCallback(async (listId: string, updatedProps: Partial<List>) => {
    // Immediately update the cached data
    patchList(listId, updatedProps);
    // Special handling is needed to normalize the data for server
    await queueChange("updateList", { listId, updates: normalizeDataForServerCall(updatedProps) });
  }, []);
}

function normalizeDataForServerCall(updatedProps: Partial<List>): Partial<ServerList> {
  const serverData = { ...updatedProps } as unknown as Partial<ServerList>;
  if (updatedProps.tasks) {
    serverData.tasks = updatedProps.tasks.map(m => m.id);
  }
  if (updatedProps.members) {
    serverData.members = updatedProps.members.map(m => m.id);
  }
  return serverData;
}

export default useModifyList;
