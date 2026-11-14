import { useCallback } from "react";
import { useParams } from "react-router-dom";
import { generatePath } from "react-router";

function useGeneratedUrl() {
  const baseUrl = "/:currentListId";
  const params = useParams();
  const generateUrl = useCallback(
    (url = "", _params?: { [key: string]: string }) => {
      // Pages outside `/:currentListId/*` (e.g. Wrapped) fall back to the last viewed
      // list so list-scoped links like profile-settings still resolve.
      const currentListId = params.currentListId || localStorage.getItem("lastViewedList") || "inbox";
      return generatePath(baseUrl + url, Object.assign({ currentListId }, params, _params));
    },
    [params]
  );
  return generateUrl;
}

export default useGeneratedUrl;
