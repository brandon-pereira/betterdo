import { useLayoutEffect, useRef } from "react";

/** Renders a theme-color meta tag (browser chrome / status bar tint) for as long as the caller is mounted. */
function useThemeColor(color: string) {
  const meta = useRef<HTMLMetaElement | null>(null);

  useLayoutEffect(() => {
    const element = document.createElement("meta");
    element.name = "theme-color";
    document.head.append(element);
    meta.current = element;
    return () => element.remove();
  }, []);

  useLayoutEffect(() => {
    meta.current!.content = color;
  }, [color]);
}

export default useThemeColor;
