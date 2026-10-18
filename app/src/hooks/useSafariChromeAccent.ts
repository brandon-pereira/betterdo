import { useCallback } from "react";

import type { Colord } from "colord";

import useOsDarkMode from "./useOsDarkMode";

import { getSafariChromeAccent } from "@utilities/colors";

/**
 * Returns a function that adjusts a color for Safari's chrome/status bar.
 * Based on the OS color scheme (not the app theme), and re-renders consumers
 * when the system appearance changes.
 */
function useSafariChromeAccent() {
  const isOsDarkMode = useOsDarkMode();
  return useCallback((color: string | Colord) => getSafariChromeAccent(color, isOsDarkMode), [isOsDarkMode]);
}

export default useSafariChromeAccent;
