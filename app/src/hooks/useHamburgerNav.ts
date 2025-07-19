import { useState } from "react";

import createSharedHook from "./internal/createSharedHook";
import useResponsive from "./useResponsive";

function useHamburgerNavOnce(): [boolean, (bool: boolean) => void] {
  const { currentScreen } = useResponsive();
  const [isNavOpen, setNavOpen] = useState(false);
  return [isNavOpen && currentScreen === "small", setNavOpen];
}

const { Provider: ModalsProvider, useConsumer: useHamburgerNav } = createSharedHook(useHamburgerNavOnce);

export { ModalsProvider };
export default useHamburgerNav;
