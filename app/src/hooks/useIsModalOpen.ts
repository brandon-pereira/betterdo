import { useParams } from "react-router-dom";

// Modals are route-driven (see the nested <Routes> in pages/CoreApp.tsx), so
// whether one is open is derived from the first segment under the list route.
const MODAL_ROUTES = new Set(["create-list", "edit-list", "edit-task", "profile-settings"]);

/** Returns true while a modal route is active. */
function useIsModalOpen() {
  const { "*": subPath = "" } = useParams();
  return MODAL_ROUTES.has(subPath.split("/")[0]);
}

export default useIsModalOpen;
