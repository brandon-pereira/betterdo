import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

import useCurrentListId from "@hooks/useCurrentListId";
import useLists from "@hooks/useLists";
import FullScreenLoader from "@components/FullScreenLoader";
import GlobalError from "@components/ErrorBoundary/GlobalError";
import { getListSlug } from "@utilities/customLists";

function InitialListRedirect() {
  const currentListId = useCurrentListId();
  const navigate = useNavigate();
  const { lists, error, loading } = useLists();

  // Optimistic redirect: if we have a previously viewed list in localStorage,
  // navigate there immediately without waiting for the /lists fetch to resolve.
  // The destination list page validates the slug itself and redirects back to
  // "/" if it turns out to be stale, so this is safe.
  useEffect(() => {
    if (!currentListId || currentListId === "inbox") {
      const lastListId = localStorage.getItem("lastViewedList");
      if (lastListId && lastListId !== "inbox") {
        navigate(`/${lastListId}`);
      }
    }
    // Only run once on mount for the optimistic path.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fallback: once lists have loaded, resolve to a real list (used when there
  // was no usable lastViewedList to optimistically navigate to).
  useEffect(() => {
    if ((!currentListId || currentListId === "inbox") && !loading) {
      const inbox = lists.find(l => l.type === "inbox");
      const lastListId = localStorage.getItem("lastViewedList");
      const lastVisited = lists.find(l => l.id === lastListId || getListSlug(l) === lastListId);
      if (lastVisited) {
        navigate(`/${getListSlug(lastVisited)}`);
      } else if (inbox) {
        navigate(`/${getListSlug(inbox)}`);
      } else if (lists[0]) {
        navigate(`/${getListSlug(lists[0])}`);
      }
    }
  }, [currentListId, navigate, lists, loading]);

  if (error) {
    return <GlobalError errorMessage={error} />;
  }
  return <FullScreenLoader />;
}

export default InitialListRedirect;
