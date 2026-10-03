import { useLayoutEffect } from "react";

import { LIGHT_VARS, DARK_VARS } from "../theme";

import useDarkMode from "@hooks/useDarkMode";

import "./globalStyles.css";

/**
 * Applies the active theme by writing its CSS custom properties onto the
 * document root. Linaria styles reference these via `var(--...)`, so toggling
 * dark mode simply swaps the values here — no re-render of styled components
 * required.
 */
export function ThemeProvider({ children }: { children: React.ReactChild }) {
  const [isDarkMode] = useDarkMode();

  useLayoutEffect(() => {
    const vars = isDarkMode ? DARK_VARS : LIGHT_VARS;
    const root = document.documentElement;
    for (const [name, value] of Object.entries(vars)) {
      root.style.setProperty(`--${name}`, value);
    }
    root.dataset.theme = isDarkMode ? "dark" : "light";
  }, [isDarkMode]);

  return <>{children}</>;
}

/**
 * Returns concrete (resolved) theme values for the active mode. Use this when a
 * value is needed in JS at runtime — e.g. for color-contrast math — rather than
 * as a CSS `var(--...)` reference.
 */
export function useResolvedTheme() {
  const [isDarkMode] = useDarkMode();
  const vars = isDarkMode ? DARK_VARS : LIGHT_VARS;
  return {
    modalContentBackground: vars["colors-modals-content-background"]
  };
}
