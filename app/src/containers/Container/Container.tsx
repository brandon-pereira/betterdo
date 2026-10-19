import { useLayoutEffect } from "react";

import { _Container } from "./Container.styles";

import useHamburgerNav from "@hooks/useHamburgerNav";
import useChromeColor from "@hooks/useChromeColor";

function Container({ children }: { children: React.ReactNode }) {
  const [isMobileNavVisible] = useHamburgerNav();
  const { listColor, chromeColor } = useChromeColor();

  // Promote the chrome color onto the document root so that the html/body
  // background (and therefore Safari's chrome/status-bar tint, which samples
  // the root background near the top edge) stays in sync with what's shown on
  // screen. Children keep the plain list color via the local override below.
  useLayoutEffect(() => {
    document.documentElement.style.setProperty("--current-list-color", chromeColor);
  }, [chromeColor]);

  return (
    <_Container
      data-mobile-nav={isMobileNavVisible ? "true" : "false"}
      style={{ "--current-list-color": listColor } as React.CSSProperties}
    >
      {children}
    </_Container>
  );
}

export default Container;
