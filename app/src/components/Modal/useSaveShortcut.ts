import { useEffect } from "react";

function isSaveShortcut(event: KeyboardEvent) {
  return (event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "s";
}

function useSaveShortcut(callback?: () => void) {
  useEffect(() => {
    if (!window || !window.document || !callback) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (isSaveShortcut(event)) {
        // Stop the browser's native "Save Page As" dialog from opening
        event.preventDefault();
        callback();
      }
    };
    window.document.addEventListener("keydown", onKeyDown);
    return () => {
      window.document.removeEventListener("keydown", onKeyDown);
    };
  }, [callback]);
}

export default useSaveShortcut;
