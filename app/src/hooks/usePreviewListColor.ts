import { useCallback, useEffect, useRef } from "react";
import { useSWRConfig } from "swr";

import { getListDetailUrl } from "./internal/urls";

import List from "@customTypes/list";
import useCompletedTasks from "@hooks/useCompletedTasks";

/**
 * Lets the Edit List modal preview a list color across the app (header, chrome,
 * etc.) before it's saved. Optimistically patches the SWR list cache without
 * revalidating so every consumer of `useListDetails` reflects the picked color
 * immediately. On unmount any un-saved preview is rolled back by revalidating.
 */
function usePreviewListColor(listId: string) {
  const { mutate } = useSWRConfig();
  const [isCompletedTasksIncluded] = useCompletedTasks();
  const key = getListDetailUrl(listId, isCompletedTasksIncluded);
  const hasPreview = useRef(false);

  const preview = useCallback(
    (color: string) => {
      hasPreview.current = true;
      mutate(key, (current?: Partial<List>) => ({ ...current, color }) as Partial<List>, false);
    },
    [key, mutate]
  );

  // If the modal closes with an un-saved preview still applied, revalidate to
  // restore the persisted color. Saving triggers its own revalidation, so this
  // only reverts discarded edits.
  const commit = useCallback(() => {
    hasPreview.current = false;
  }, []);

  useEffect(() => {
    return () => {
      if (hasPreview.current) {
        mutate(key);
      }
    };
  }, [key, mutate]);

  return { preview, commit };
}

export default usePreviewListColor;
