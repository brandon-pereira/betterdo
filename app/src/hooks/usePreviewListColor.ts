import { useCallback, useEffect, useRef } from "react";

import { patchList } from "@utilities/listCache";

/**
 * Lets the Edit List modal preview a list color across the app (header, chrome,
 * etc.) before it's saved, by patching the cached list so every consumer of
 * `useListDetails` reflects the picked color immediately. On unmount any
 * un-saved preview is rolled back to the original color.
 */
function usePreviewListColor(listId: string, savedColor?: string) {
  const originalColor = useRef<string | undefined>(undefined);

  const preview = useCallback(
    (color: string) => {
      if (originalColor.current === undefined) {
        originalColor.current = savedColor;
      }
      patchList(listId, { color });
    },
    [listId, savedColor]
  );

  // Saving keeps the previewed color, so there's nothing to roll back.
  const commit = useCallback(() => {
    originalColor.current = undefined;
  }, []);

  useEffect(() => {
    return () => {
      if (originalColor.current !== undefined) {
        patchList(listId, { color: originalColor.current });
        originalColor.current = undefined;
      }
    };
  }, [listId]);

  return { preview, commit };
}

export default usePreviewListColor;
