import { DARK_VARS, LIGHT_VARS } from "../theme";

import useCurrentListId from "./useCurrentListId";
import useDarkMode from "./useDarkMode";
import useHamburgerNav from "./useHamburgerNav";
import useIsModalOpen from "./useIsModalOpen";
import useListDetails from "./useListDetails";
import useOsDarkMode from "./useOsDarkMode";

import { getColorUnderOverlay, getSafariChromeAccent } from "@utilities/colors";

const MOBILE_NAV_COLOR = "#080808";
const OVERLAY_VAR = "colors-modals-overlay-background";

interface ChromeColors {
  /**
   * The current list color, adjusted for Safari's chrome based on the OS color
   * scheme. Use for surfaces painted with the list color (header, logo).
   */
  listColor: string;
  /** Whether `listColor` is dark, for picking legible foreground text. */
  isListColorDark: boolean;
  /**
   * What the browser chrome (theme-color meta / Safari status bar tint) should
   * show, matching the top of the screen: `listColor`, swapped for the dark nav
   * color when the mobile nav is open, and dimmed by the backdrop while a modal
   * is open.
   */
  chromeColor: string;
}

/** Single source of truth for list/chrome accent colors. */
function useChromeColor(): ChromeColors {
  const currentListId = useCurrentListId();
  const { list } = useListDetails(currentListId);
  const isOsDarkMode = useOsDarkMode();
  const [isNavOpen] = useHamburgerNav();
  const [isDarkMode] = useDarkMode();
  const isModalOpen = useIsModalOpen();

  const listAccent = getSafariChromeAccent(list.color!, isOsDarkMode);
  const listColor = listAccent.toHex();

  let chromeColor = isNavOpen ? MOBILE_NAV_COLOR : listColor;
  if (isModalOpen) {
    const overlay = (isDarkMode ? DARK_VARS : LIGHT_VARS)[OVERLAY_VAR];
    chromeColor = getColorUnderOverlay(chromeColor, overlay).toHex();
  }

  return { listColor, isListColorDark: listAccent.isDark(), chromeColor };
}

export default useChromeColor;
