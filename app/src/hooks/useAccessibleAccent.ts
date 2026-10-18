import { useCallback } from "react";

import type { Colord } from "colord";

import useDarkMode from "./useDarkMode";

import { getAccessibleAccent } from "@utilities/colors";

/**
 * Returns a function that adjusts an accent color for the active app theme.
 * Re-renders consumers when the resolved app theme changes.
 */
function useAccessibleAccent() {
  const [isDarkMode] = useDarkMode();
  return useCallback((color: string | Colord) => getAccessibleAccent(color, isDarkMode), [isDarkMode]);
}

export default useAccessibleAccent;
