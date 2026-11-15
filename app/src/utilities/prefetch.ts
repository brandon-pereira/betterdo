import { queryClient } from "./queryClient";

import { getListDetailUrl, getListsUrl } from "@hooks/internal/urls";
import { hasCachedSession } from "@utilities/auth";

// Starts the first screen's data requests as soon as the app boots, in parallel
// with the session check, instead of waiting for the session to resolve and the
// app to render. The hooks pick up these in-flight requests from the query
// cache, so nothing is fetched twice. Skipped when the user was signed out last
// time, since the requests would only 401.
function getInitialListId(): string | null {
  const [firstSegment] = window.location.pathname.slice(import.meta.env.BASE_URL.length).split("/");
  if (firstSegment && firstSegment !== "auth" && firstSegment !== "wrapped") {
    return firstSegment;
  }
  // Mirrors InitialListRedirect: "/" goes to the last viewed list, or the inbox
  // (whose slug isn't known until the lists load) when there isn't one.
  const lastViewedList = localStorage.getItem("lastViewedList");
  return lastViewedList && lastViewedList !== "inbox" ? lastViewedList : null;
}

if (hasCachedSession()) {
  // prefetchQuery never rejects; errors surface when a hook reads the query.
  queryClient.prefetchQuery({ queryKey: [getListsUrl()] });
  const listId = getInitialListId();
  if (listId) {
    queryClient.prefetchQuery({ queryKey: [getListDetailUrl(listId)] });
  }
}
