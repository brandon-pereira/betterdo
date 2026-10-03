import { _Container } from "./Container.styles";

import useHamburgerNav from "@hooks/useHamburgerNav";
import useCurrentListId from "@hooks/useCurrentListId";
import useListDetails from "@hooks/useListDetails";
import { getAccessibleAccent } from "@utilities/colors";

function Container({ children }: { children: React.ReactNode }) {
  const [isMobileNavVisible] = useHamburgerNav();
  const currentListId = useCurrentListId();
  const { list } = useListDetails(currentListId);
  const color = getAccessibleAccent(list.color!);
  return (
    <_Container
      data-mobile-nav={isMobileNavVisible ? "true" : "false"}
      style={{ "--current-list-color": color.toHex() } as React.CSSProperties}
    >
      {children}
    </_Container>
  );
}

export default Container;
