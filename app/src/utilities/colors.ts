import { Colord, colord, extend } from "colord";
import a11yPlugin from "colord/plugins/a11y";

import { DEFAULT_LIST_COLOR } from "../constants";

// Provides `.luminance()`, used by the accent helpers below.
extend([a11yPlugin]);

/**
 * Returns a foreground color (dark or light) that contrasts with the given
 * background: near-black on light backgrounds, white on dark ones. Backgrounds
 * that can't be parsed (e.g. a CSS variable or undefined) are treated as dark,
 * so the safe default is white.
 */
export function getContrastingTextColor(backgroundColor?: string | Colord, dark = "#1a1a1a", light = "#fff") {
  if (!backgroundColor) return light;
  const parsed = colord(backgroundColor);
  if (!parsed.isValid()) return light;
  return parsed.isDark() ? light : dark;
}

function isSafari() {
  return /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
}

/**
 * Nudges an accent color so it reads legibly against the current theme's
 * surface, regardless of browser. On the dark theme light accents are fine but
 * very dark ones get lightened; on the light theme very light accents get
 * darkened. The adjusted color is returned so callers can use it as a text or
 * background accent (tabs, buttons, headers, etc.).
 *
 * `isDarkMode` is the resolved app theme. In components, prefer the
 * `useAccessibleAccent` hook so this re-runs when the theme changes.
 */
export function getAccessibleAccent(color: string | Colord, isDarkMode: boolean): Colord {
  color = colord(color || DEFAULT_LIST_COLOR);
  if (!color.isValid()) {
    return colord(DEFAULT_LIST_COLOR);
  }
  const luminance = color.luminance();
  if (isDarkMode) {
    // Too dark to stand out on the dark surface -> lighten it.
    if (luminance < 0.12) {
      return getAccessibleAccent(color.lighten(0.05), isDarkMode);
    }
  } else {
    // Too light to stand out on the light surface -> darken it.
    if (luminance > 0.65) {
      return getAccessibleAccent(color.darken(0.05), isDarkMode);
    }
  }
  return color;
}

/**
 * Safari samples the document root background near the top edge to tint its
 * chrome/status bar. On Safari we adjust the accent used for the app chrome
 * (status bar / theme-color meta) based on the OS color scheme: darken light
 * colors in dark mode, lighten dark colors in light mode.
 * Other browsers and non-chrome surfaces should keep the raw color.
 *
 * `isOsDarkMode` is the OS color scheme (not the app theme). In components,
 * prefer the `useSafariChromeAccent` hook so this re-runs when it changes.
 */
export function getSafariChromeAccent(color: string | Colord, isOsDarkMode: boolean): Colord {
  color = colord(color || DEFAULT_LIST_COLOR);
  if (!color.isValid()) {
    return colord(DEFAULT_LIST_COLOR);
  }
  if (!isSafari()) {
    return color;
  }
  const luminance = color.luminance();
  if (isOsDarkMode) {
    // Too light for the dark chrome -> darken it.
    if (luminance > 0.2) {
      return getSafariChromeAccent(color.darken(0.05), isOsDarkMode);
    }
  } else {
    // Too dark for the light chrome -> lighten it.
    if (luminance < 0.32) {
      return getSafariChromeAccent(color.lighten(0.01), isOsDarkMode);
    }
  }
  return color;
}
