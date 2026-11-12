import { preload } from "swr";

import { getListDetailUrl, getListsUrl } from "@hooks/internal/urls";
import { hasCachedSession } from "@utilities/auth";
import { fetcher } from "@utilities/fetcher";

// Starts the first screen's data requests as soon as the app boots, in parallel
// with the session check, instead of waiting for the session to resolve and the
// app to render. The hooks pick up these in-flight requests via SWR's preload
// cache, so nothing is fetched twice. Skipped when the user was signed out last
// time, since the requests would only 401.
function getInitialListId(): string | null {
  const [firstSegment] = window.location.pathname.slice(import.meta.env.BASE_URL.length).split("/");
  if (firstSegment && firstSegment !== "auth") {
    return firstSegment;
  }
  // Mirrors InitialListRedirect: "/" goes to the last viewed list, or the inbox
  // (whose slug isn't known until the lists load) when there isn't one.
  const lastViewedList = localStorage.getItem("lastViewedList");
  return lastViewedList && lastViewedList !== "inbox" ? lastViewedList : null;
}

if (hasCachedSession()) {
  // Errors surface when a hook consumes the request; catch here so an unused
  // preload (e.g. the session turned out to be expired) isn't an unhandled rejection.
  preload(getListsUrl(), fetcher).catch(() => {});
  const listId = getInitialListId();
  if (listId) {
    preload(getListDetailUrl(listId), fetcher).catch(() => {});
  }
}
