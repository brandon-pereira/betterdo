import { Colord, colord, extend } from "colord";
import a11yPlugin from "colord/plugins/a11y";

import { DEFAULT_LIST_COLOR } from "../constants";

// Provides `.luminance()` and `.contrast()`, used by the accent helpers below.
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

/**
 * Surfaces accent colors are drawn on top of, per theme. For dark mode this is
 * the lightest dark surface (form fields / modal glass), which is the worst
 * case for contrast against a light accent.
 */
const ACCENT_SURFACE = { light: "#ffffff", dark: "#1e1e1e" } as const;
const ON_ACCENT_DARK = "#1a1a1a";
const ON_ACCENT_LIGHT = "#ffffff";

// WCAG 2.x thresholds.
const MIN_NON_TEXT_CONTRAST = 3; // 1.4.11 Non-text Contrast (focus rings, selected fills, borders)
const MIN_TEXT_CONTRAST = 4.5; // 1.4.3 Contrast (Minimum) for normal-size text

export interface AccentPalette {
  /** Fills, borders and focus rings. >= 3:1 against the theme surface. */
  accent: string;
  /** Accent used as text (e.g. links). >= 4.5:1 against the theme surface. */
  accentText: string;
  /** Text/icons drawn on top of `accent`. >= 4.5:1 against `accent`. */
  onAccent: string;
}

function getOnAccentColor(accent: Colord) {
  return accent.contrast(ON_ACCENT_LIGHT) >= accent.contrast(ON_ACCENT_DARK) ? ON_ACCENT_LIGHT : ON_ACCENT_DARK;
}

/**
 * Pushes a color away from the theme surface (darker on light, lighter on dark)
 * in small steps until `isAcceptable` passes. Small steps keep the result as
 * close to the user's chosen hue as possible.
 */
function adjustAwayFromSurface(color: Colord, isDarkMode: boolean, isAcceptable: (color: Colord) => boolean) {
  // Round-trip through hex at every step so the color we measure is exactly the
  // color we emit (HSL adjustments are fractional and can shift when rounded).
  let adjusted = colord(color.toHex());
  // 40 * 0.025 covers the full lightness range, so this always terminates at
  // black/white at worst, both of which pass every threshold used here.
  for (let i = 0; i < 40 && !isAcceptable(adjusted); i++) {
    adjusted = colord((isDarkMode ? adjusted.lighten(0.025) : adjusted.darken(0.025)).toHex());
  }
  return adjusted;
}

/**
 * Derives a WCAG-compliant accent palette from an arbitrary (user-chosen) list
 * color for the active app theme. Unlike `getAccessibleAccent`, which only
 * applies a luminance heuristic, this measures actual contrast ratios so the
 * accent is safe for selected states, focus indicators and text on/over it.
 */
export function getAccentPalette(color: string | Colord | undefined, isDarkMode: boolean): AccentPalette {
  let base = colord(color || DEFAULT_LIST_COLOR);
  if (!base.isValid()) {
    base = colord(DEFAULT_LIST_COLOR);
  }
  const surface = isDarkMode ? ACCENT_SURFACE.dark : ACCENT_SURFACE.light;

  const accent = adjustAwayFromSurface(
    base,
    isDarkMode,
    c => c.contrast(surface) >= MIN_NON_TEXT_CONTRAST && c.contrast(getOnAccentColor(c)) >= MIN_TEXT_CONTRAST
  );
  const accentText = adjustAwayFromSurface(accent, isDarkMode, c => c.contrast(surface) >= MIN_TEXT_CONTRAST);

  return {
    accent: accent.toHex(),
    accentText: accentText.toHex(),
    onAccent: getOnAccentColor(accent)
  };
}
