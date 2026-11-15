import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";

import { getListDetailUrl } from "./internal/urls";

import List from "@customTypes/list";
import Task from "@customTypes/task";
import useCompletedTasks from "@hooks/useCompletedTasks";
import useHamburgerNav from "@hooks/useHamburgerNav";
import { getListSlug } from "@utilities/customLists";
import { isQueueIdle } from "@utilities/queryClient";

type DeepOptional<T> = T extends object ? DeepOptionalObject<T> : T | undefined;

type DeepOptionalObject<T> = { [P in keyof T]?: DeepOptional<T[P]> };

function useSwitchList() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [, setShowCompletedTasks] = useCompletedTasks();
  const [, setMobileNavVisibility] = useHamburgerNav();

  const switchList = useCallback(
    async (nextList: DeepOptional<List>) => {
      if (!nextList.id) {
        console.warn("Next List ID is required!");
        return;
      }
      // Use type-based slug for custom lists (inbox, today, etc.), UUID for regular lists
      const slug = getListSlug(nextList as { id: string; type?: string });
      if (nextList && nextList.tasks) {
        nextList.tasks = nextList.tasks.map(id => {
          if (typeof id === "string") {
            return {
              id: id,
              isTemporaryTask: true,
              isLoading: true
            } as Partial<Task>;
          }
          return id;
        });
      }
      // close the hamburger nav
      setMobileNavVisibility(false);
      // Show what the sidebar knows about the list right away, unless the full
      // list is already cached. Marked stale so it's fetched when it opens.
      const queryKey = [getListDetailUrl(slug)];
      if (!queryClient.getQueryData(queryKey)) {
        queryClient.setQueryData<Partial<List>>(queryKey, nextList as Partial<List>, { updatedAt: 0 });
      }
      // turn off completed tasks view
      setShowCompletedTasks(false);
      // update url
      navigate(`/${slug}`);
      // Refresh when changing lists, unless local changes are still queued
      // (the queue refreshes everything once it's sent)
      if (isQueueIdle()) {
        await queryClient.invalidateQueries({ queryKey });
      }
    },
    [navigate, queryClient, setMobileNavVisibility, setShowCompletedTasks]
  );

  return switchList;
}

export default useSwitchList;
