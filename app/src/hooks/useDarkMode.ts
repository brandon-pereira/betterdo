import { useCallback, useState } from "react";

import createSharedHook from "./internal/createSharedHook";
import useOsDarkMode from "./useOsDarkMode";

const localStorageKey = "doesBetterDoPreferDarkMode";

function useDarkModeOnce(): [boolean, (bool: boolean) => void] {
  const isOSinDarkMode = useOsDarkMode();
  const [doesUserPreferDarkMode, setUserDarkPreference] = useState(parseValue(localStorage.getItem(localStorageKey)));

  const shouldUseDarkMode = isOSinDarkMode && doesUserPreferDarkMode ? true : false;

  const setPrefersDarkMode = useCallback((bool: boolean) => {
    if (bool) {
      setUserDarkPreference(true);
      localStorage.setItem(localStorageKey, "true");
    } else {
      setUserDarkPreference(false);
      localStorage.setItem(localStorageKey, "false");
    }
  }, []);

  return [shouldUseDarkMode, setPrefersDarkMode];
}

function parseValue(val: string | null): boolean {
  if (val === "true") return true;
  else if (val === "false") return false;
  // if no pref set, assume dark mode enabled
  else return true;
}

const { Provider: DarkModeProvider, useConsumer: useDarkMode } = createSharedHook(useDarkModeOnce);

export { DarkModeProvider };
export default useDarkMode;
