import { useQuery } from "@tanstack/react-query";

import { getTaskDetailUrl } from "./internal/urls";

import Task from "@customTypes/task";
import { isQueueIdle } from "@utilities/queryClient";

function useTaskDetails(taskId: string) {
  const { data, error, fetchStatus } = useQuery<Task>({
    queryKey: [getTaskDetailUrl(taskId)],
    staleTime: 5000,
    refetchInterval: () => (isQueueIdle() ? 30000 : false)
  });

  return {
    error,
    loading: Boolean(!data),
    // The task's details (e.g. notes) were never loaded on this device and
    // there's no connection to load them now.
    unavailableOffline: !data && fetchStatus === "paused",
    task: data
  };
}

export default useTaskDetails;
