import { useMemo } from "react";

import useDarkMode from "./useDarkMode";

import { DEFAULT_LIST_COLOR } from "../constants";
import { DARK_VARS, LIGHT_VARS } from "../theme";

import { getAccentPalette } from "@utilities/colors";

/**
 * Returns a contrast-checked accent palette for `color` in the active app theme.
 * Lists without a chosen color (missing, or the default gray) use the app's
 * default accent (`theme.colors.general.blue`) instead of a gray accent.
 * Re-computes when the color or the resolved app theme changes.
 */
function useAccentPalette(color?: string) {
  const [isDarkMode] = useDarkMode();
  return useMemo(() => {
    const isDefaultColor = !color || color.toLowerCase() === DEFAULT_LIST_COLOR.toLowerCase();
    const themeAccent = (isDarkMode ? DARK_VARS : LIGHT_VARS)["colors-general-blue"];
    return getAccentPalette(isDefaultColor ? themeAccent : color, isDarkMode);
  }, [color, isDarkMode]);
}

export default useAccentPalette;
