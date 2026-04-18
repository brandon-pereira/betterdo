import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

import useCurrentListId from "@hooks/useCurrentListId";
import useLists from "@hooks/useLists";
import GlobalError from "@components/ErrorBoundary/GlobalError";
import { getListSlug } from "@utilities/customLists";

function InitialListRedirect() {
  const currentListId = useCurrentListId();
  const navigate = useNavigate();
  const { lists, error, loading } = useLists();
  useEffect(() => {
    if ((!currentListId || currentListId === "inbox") && !loading) {
      const inbox = lists.find(l => l.type === "inbox");
      const lastListId = localStorage.getItem("lastViewedList");
      const lastVisited = lists.find(l => l.id === lastListId || getListSlug(l) === lastListId);
      if (lastVisited) {
        navigate(`/${getListSlug(lastVisited)}`);
      } else if (inbox) {
        navigate(`/${getListSlug(inbox)}`);
      } else {
        navigate(`/${getListSlug(lists[0])}`);
      }
    }
  }, [currentListId, navigate, lists, loading]);

  if (error) {
    return <GlobalError errorMessage={error} />;
  }
  return <div>Redirecting...</div>;
}

export default InitialListRedirect;
