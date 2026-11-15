import { useCallback } from "react";
import { useNavigate } from "react-router-dom";

import Task from "@customTypes/task";
import useGeneratedUrl from "@hooks/useGeneratedUrl";
import useCurrentListId from "@hooks/useCurrentListId";
import { moveTaskToList, moveTaskToSection, patchTask } from "@utilities/listCache";
import { queueChange } from "@utilities/offlineQueue";

function useModifyTask() {
  const navigate = useNavigate();
  const currentListId = useCurrentListId();
  const generateUrl = useGeneratedUrl();
  return useCallback(
    async (taskId: string, _listId: string, updatedProps: Partial<Task>) => {
      if (
        // If dueDate is passed in and format is 'YYYY-MM-DD' then
        // we need to create a date obj using CURRENT timezone
        // (strings generate with UTC by default) then pass the UTC
        // version to server (since current timezone to UTC will include timezone)
        updatedProps.dueDate &&
        typeof updatedProps.dueDate === "string" &&
        // make sure its in 'YYYY-MM-DD' not already ISO string
        updatedProps.dueDate.length === 10
      ) {
        const [year, month, day] = updatedProps.dueDate.split("-");
        updatedProps.dueDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day)).toUTCString();
      }
      patchTask(taskId, updatedProps);
      const isMovingList = Boolean(updatedProps.listId && updatedProps.listId !== currentListId);
      if (isMovingList) {
        moveTaskToList(taskId, updatedProps.listId!);
      }
      const saved = queueChange("updateTask", { taskId, updates: updatedProps });
      if (updatedProps.isCompleted !== undefined) {
        // Let the checkbox animation play before the task moves sections.
        const sleep = new Promise(resolve => setTimeout(resolve, 300));
        await Promise.all([saved, sleep]);
        moveTaskToSection(taskId, updatedProps.isCompleted);
      } else {
        await saved;
      }
      if (isMovingList) {
        navigate(
          generateUrl(`/edit-task/:taskId`, {
            currentListId: updatedProps.listId!,
            taskId: taskId
          })
        );
      }
    },
    [currentListId, navigate, generateUrl]
  );
}

export default useModifyTask;
