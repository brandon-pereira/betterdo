import { useLayoutEffect } from "react";

import { DEFAULT_LIST_COLOR } from "../../constants";

import useCurrentListId from "@hooks/useCurrentListId";
import useListDetails from "@hooks/useListDetails";
import useChromeColor from "@hooks/useChromeColor";
import useThemeColor from "@hooks/useThemeColor";

const BASE_TITLE = "BetterDo.";

interface Props {
  // Replaces the current list's title on pages that aren't a list (e.g. Wrapped).
  title?: string;
}

// Sets the document title and theme-color for the current list. Written
// directly to the DOM rather than via react-helmet-async to keep it out of the
// main chunk.
function Helmet({ title: pageTitle }: Props) {
  const { chromeColor } = useChromeColor();
  const currentListId = useCurrentListId();
  const { list, error } = useListDetails(currentListId);

  const hasList = !error && Boolean(list);
  const titleSuffix = pageTitle ?? (hasList ? list.title : undefined);
  const title = titleSuffix ? `${BASE_TITLE} - ${titleSuffix}` : BASE_TITLE;
  const themeColor = hasList ? chromeColor : DEFAULT_LIST_COLOR;

  useLayoutEffect(() => {
    document.title = title;
  }, [title]);

  useLayoutEffect(() => {
    return () => {
      document.title = BASE_TITLE;
    };
  }, []);

  useThemeColor(themeColor);

  return null;
}

export default Helmet;
