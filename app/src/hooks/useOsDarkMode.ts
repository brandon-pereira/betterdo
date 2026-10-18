import { useEffect, useState } from "react";

const query = "(prefers-color-scheme: dark)";

/**
 * Tracks the OS-level color scheme, independent of the in-app theme preference.
 * Browser chrome (e.g. Safari's status bar) follows this, not the app theme.
 */
function useOsDarkMode(): boolean {
  const [isOsDarkMode, setOsDarkMode] = useState(() => window.matchMedia(query).matches);

  useEffect(() => {
    const matcher = window.matchMedia(query);
    const fn = (e: MediaQueryListEvent) => setOsDarkMode(e.matches);
    matcher.addEventListener("change", fn);
    return () => matcher.removeEventListener("change", fn);
  }, []);

  return isOsDarkMode;
}

export default useOsDarkMode;
