import { Colord, colord, extend } from "colord";
import a11yPlugin from "colord/plugins/a11y";

import { DEFAULT_LIST_COLOR } from "../constants";

extend([a11yPlugin]);

export function checkIfColorGoodContrast(textColor: string, backgroundColor: string) {
  const isColorGoodContrast = colord(textColor).isReadable(colord(backgroundColor));

  return isColorGoodContrast;
}

/**
 * TODO: Improve this function. It needs to do a couple things:
 * 1. should work regarless of safari
 * 2. should also lighten colors
 * 3. maybe use the a11y plugins better
 * 4. split out current logic to a special getSafariAccentColor with reasoning
 * 5. properly handle user overrides via checking theme of body element
 */
export function getAccessibleAccent(color: string | Colord) {
  if (typeof color === "string") {
    color = colord(color);
  }
  if (!color) {
    return colord(DEFAULT_LIST_COLOR);
  }
  // Respect the app's resolved theme (written to `data-theme` by ThemeProvider),
  // which factors in both the user's in-app preference and the OS setting.
  const isDarkMode = document.documentElement.dataset.theme === "dark";
  // const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
  // the higher the number, the less lightly it gets tinted
  const requirement = isDarkMode ? 0.33 : 0.4;
  // 0 is black, 1 is white
  const luminance = color.luminance();
  // if the color is too light, darken it
  if (luminance > requirement) {
    console.log("darken");
    return getAccessibleAccent(color.darken(1));
  }
  return color;
}
