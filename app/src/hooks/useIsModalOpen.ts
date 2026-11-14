import { useParams } from "react-router-dom";

import { MODAL_ROUTES } from "../constants";

// Modals are route-driven, so whether one is open is derived from the first
// segment under the page's route.

/** Returns true while a modal route is active. */
function useIsModalOpen() {
  const { "*": subPath = "" } = useParams();
  return MODAL_ROUTES.has(subPath.split("/")[0]);
}

export default useIsModalOpen;
