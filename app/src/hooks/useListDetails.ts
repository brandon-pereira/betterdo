import { useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";

import { DEFAULT_LIST_COLOR } from "../constants";

import { getListDetailUrl } from "./internal/urls";

import List from "@customTypes/list";
import useCompletedTasks from "@hooks/useCompletedTasks";
import { isQueueIdle } from "@utilities/queryClient";

function useListDetails(listId: string) {
  const previousList = useRef<Partial<List>>({
    color: DEFAULT_LIST_COLOR,
    tasks: [],
    completedTasks: []
  });
  const [isCompletedTasksIncluded] = useCompletedTasks();
  const navigate = useNavigate();
  const { data, error } = useQuery<List>({
    queryKey: [getListDetailUrl(listId, isCompletedTasksIncluded)],
    staleTime: 5000,
    // Picks up changes from other devices and shared list members.
    refetchInterval: () => (isQueueIdle() ? 30000 : false)
  });

  useEffect(() => {
    if (data && !error) {
      previousList.current = data;
    }
  }, [data, error]);

  useEffect(() => {
    if (error && error.message === "Invalid List ID" && listId !== "inbox") {
      console.warn("Invalid list detected, redirecting to inbox.");
      // Clear the stale list so InitialListRedirect doesn't send the user back to it
      if (localStorage.getItem("lastViewedList") === listId) {
        localStorage.removeItem("lastViewedList");
      }
      navigate("/inbox", { replace: true });
    }
  }, [error, listId, navigate]);

  return {
    error,
    loading: Boolean(!data),
    list: data ? data : previousList.current
  };
}

export default useListDetails;
