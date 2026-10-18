import { useLayoutEffect } from "react";

import { _Container } from "./Container.styles";

import useHamburgerNav from "@hooks/useHamburgerNav";
import useCurrentListId from "@hooks/useCurrentListId";
import useListDetails from "@hooks/useListDetails";
import useSafariChromeAccent from "@hooks/useSafariChromeAccent";

function Container({ children }: { children: React.ReactNode }) {
  const [isMobileNavVisible] = useHamburgerNav();
  const getSafariChromeAccent = useSafariChromeAccent();
  const currentListId = useCurrentListId();
  const { list } = useListDetails(currentListId);
  const color = getSafariChromeAccent(list.color!).toHex();
  // When the mobile nav is open it covers the top of the screen with the dark
  // navigation color, so match the chrome tint to that instead of the list.
  const rootColor = isMobileNavVisible ? "#080808" : color;

  // Promote the color onto the document root so that the html/body background
  // (and therefore Safari's chrome/status-bar tint, which samples the root
  // background near the top edge) stays in sync with what's shown on screen.
  useLayoutEffect(() => {
    document.documentElement.style.setProperty("--current-list-color", rootColor);
  }, [rootColor]);

  return (
    <_Container
      data-mobile-nav={isMobileNavVisible ? "true" : "false"}
      style={{ "--current-list-color": color } as React.CSSProperties}
    >
      {children}
    </_Container>
  );
}

export default Container;
