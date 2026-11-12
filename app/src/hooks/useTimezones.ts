import { useEffect, useState } from "react";

import useLocalStorage from "./useLocalStorage";
import useProfile from "./useProfile";

function useTimezones() {
  const { profile } = useProfile();
  const [dismissed, setDismissed] = useLocalStorage("banners.tz", false);
  const [resolvedTimeZone, setResolvedTimeZone] = useState<string | null>(null);
  const serverTimeZone = profile?.timeZone;
  const browserTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  // The browser's zone usually matches the profile exactly, so only load the
  // (large) timezone database when it doesn't. It's still needed then to map
  // aliases (e.g. "Canada/Mountain") to the canonical name stored on the profile.
  const needsLookup = Boolean(!dismissed && serverTimeZone && browserTimeZone !== serverTimeZone);

  useEffect(() => {
    if (!needsLookup) {
      return;
    }
    let cancelled = false;
    import("@utilities/timezones").then(({ getTimeZone }) => {
      if (!cancelled) {
        setResolvedTimeZone(getTimeZone(browserTimeZone).name);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [needsLookup, browserTimeZone]);

  const localTimeZone = needsLookup ? resolvedTimeZone : null;
  const isTimezoneChanged = Boolean(localTimeZone && localTimeZone !== serverTimeZone);

  return {
    isTimezoneChanged,
    localTimeZone,
    setDismissed
  };
}

export default useTimezones;
