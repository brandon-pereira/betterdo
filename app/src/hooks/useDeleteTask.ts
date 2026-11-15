import { useCallback } from "react";

import useEditTaskModal from "@hooks/useEditTaskModal";
import { removeTask } from "@utilities/listCache";
import { queueChange } from "@utilities/offlineQueue";
import { vibrate } from "@utilities/haptics";

function useDeleteTask() {
  const { closeModal } = useEditTaskModal();
  return useCallback(
    async (taskId: string) => {
      vibrate("error");
      const deleted = queueChange("deleteTask", { taskId });
      closeModal();
      removeTask(taskId);
      await deleted;
    },
    [closeModal]
  );
}

export default useDeleteTask;
