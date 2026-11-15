import { useCallback } from "react";

import Task from "@customTypes/task";
import useProfile from "@hooks/useProfile";
import { addTask } from "@utilities/listCache";
import { queueChange } from "@utilities/offlineQueue";

function useCreateTask() {
  const { profile } = useProfile();
  return useCallback(
    async (listId: string, taskName: string) => {
      // The id is generated here so the task can be edited (or deleted) before
      // the server has seen it, e.g. while offline.
      const id = crypto.randomUUID();
      addTask(listId, {
        id,
        title: taskName,
        listId,
        isCompleted: false,
        priority: "normal",
        notes: "",
        createdBy: profile ?? undefined,
        creationDate: new Date().toISOString()
      } as Task);
      await queueChange("createTask", { id, listId, title: taskName });
    },
    [profile]
  );
}

export default useCreateTask;
