import { useCallback } from "react";
import { useParams } from "react-router-dom";
import { generatePath } from "react-router";

function useGeneratedUrl() {
  const baseUrl = "/:currentListId";
  const params = useParams();
  const generateUrl = useCallback(
    (url = "", _params?: { [key: string]: string }) => {
      // Some pages (e.g. Wrapped) live outside the `/:currentListId/*` tree, so
      // there's no currentListId param. Fall back to the last viewed list so
      // links like profile-settings still resolve to a valid list-scoped route.
      const currentListId = params.currentListId || localStorage.getItem("lastViewedList") || "inbox";
      return generatePath(baseUrl + url, Object.assign({ currentListId }, params, _params));
    },
    [params]
  );
  return generateUrl;
}

export default useGeneratedUrl;
