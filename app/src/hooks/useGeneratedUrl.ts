import { useCallback } from "react";
import { useLocation, useParams } from "react-router-dom";
import { generatePath } from "react-router";

import { MODAL_ROUTES } from "../constants";

// The current page's path without any open modal, e.g. "/wrapped/2026-10".
function getPagePath(pathname: string) {
  const segments = pathname.split("/");
  const modalIndex = segments.findIndex(segment => MODAL_ROUTES.has(segment));
  return (modalIndex === -1 ? segments : segments.slice(0, modalIndex)).join("/");
}

function useGeneratedUrl() {
  const params = useParams();
  const { pathname } = useLocation();
  const generateUrl = useCallback(
    (url = "", _params?: { [key: string]: string }) => {
      // List pages build on the list; other pages (e.g. Wrapped) on their own path,
      // so modals open on top of them.
      const baseUrl = params.currentListId ? "/:currentListId" : getPagePath(pathname);
      return generatePath(baseUrl + url, Object.assign({}, params, _params));
    },
    [params, pathname]
  );
  return generateUrl;
}

export default useGeneratedUrl;
