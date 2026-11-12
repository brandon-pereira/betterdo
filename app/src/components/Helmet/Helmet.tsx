import { useLayoutEffect, useRef } from "react";

import { DEFAULT_LIST_COLOR } from "../../constants";

import useCurrentListId from "@hooks/useCurrentListId";
import useListDetails from "@hooks/useListDetails";
import useChromeColor from "@hooks/useChromeColor";

const BASE_TITLE = "BetterDo.";

// Sets the document title and theme-color for the current list. Written
// directly to the DOM rather than via react-helmet-async to keep it out of the
// main chunk.
function Helmet() {
  const { chromeColor } = useChromeColor();
  const currentListId = useCurrentListId();
  const { list, error } = useListDetails(currentListId);

  const hasList = !error && Boolean(list);
  const title = hasList && list.title ? `${BASE_TITLE} - ${list.title}` : BASE_TITLE;
  const themeColor = hasList ? chromeColor : DEFAULT_LIST_COLOR;

  useLayoutEffect(() => {
    document.title = title;
  }, [title]);

  useLayoutEffect(() => {
    return () => {
      document.title = BASE_TITLE;
    };
  }, []);

  const themeColorMeta = useRef<HTMLMetaElement | null>(null);
  useLayoutEffect(() => {
    const meta = document.createElement("meta");
    meta.name = "theme-color";
    document.head.append(meta);
    themeColorMeta.current = meta;
    return () => meta.remove();
  }, []);

  useLayoutEffect(() => {
    themeColorMeta.current!.content = themeColor;
  }, [themeColor]);

  return null;
}

export default Helmet;
