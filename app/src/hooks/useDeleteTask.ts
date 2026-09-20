import { useCallback } from "react";
import { mutate } from "swr";

import { getListDetailUrl } from "./internal/urls";

import useEditTaskModal from "@hooks/useEditTaskModal";
import useCompletedTasks from "@hooks/useCompletedTasks";
import { deleteTask } from "@utilities/server";
import useCurrentListId from "@hooks/useCurrentListId";
import { vibrate } from "@utilities/haptics";

function useDeleteTask() {
  const { closeModal } = useEditTaskModal();
  const currentListId = useCurrentListId();
  const [isCompletedTasksIncluded] = useCompletedTasks();
  return useCallback(
    async (taskId: string) => {
      vibrate("error");
      await deleteTask(taskId);
      closeModal();
      // Update current task list
      await mutate(getListDetailUrl(currentListId, isCompletedTasksIncluded));
    },
    [currentListId, isCompletedTasksIncluded, closeModal]
  );
}

export default useDeleteTask;
