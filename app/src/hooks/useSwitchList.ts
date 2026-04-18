import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useSWRConfig } from "swr";

import { getListDetailUrl } from "./internal/urls";

import List from "@customTypes/list";
import Task from "@customTypes/task";
import useCompletedTasks from "@hooks/useCompletedTasks";
import useHamburgerNav from "@hooks/useHamburgerNav";
import { getListSlug } from "@utilities/customLists";

type DeepOptional<T> = T extends object ? DeepOptionalObject<T> : T | undefined;

type DeepOptionalObject<T> = { [P in keyof T]?: DeepOptional<T[P]> };

function useSwitchList() {
  const { mutate } = useSWRConfig();
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
      // update the local data immediately, but disable the revalidation.
      await mutate(
        getListDetailUrl(slug),
        (list?: Partial<List>) =>
          ({
            ...nextList,
            ...list
          }) as Partial<List>,
        false
      );
      // turn off completed tasks view
      setShowCompletedTasks(false);
      // update url
      navigate(`/${slug}`);
      // Force a network refresh when changing lists
      await mutate(getListDetailUrl(slug));
    },
    [navigate, mutate, setMobileNavVisibility, setShowCompletedTasks]
  );

  return switchList;
}

export default useSwitchList;
