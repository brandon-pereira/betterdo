import { Fragment, lazy, Suspense } from "react";
import { Routes, Route, Navigate, Outlet, useLocation, useRoutes } from "react-router-dom";
import { AnimatePresence } from "framer-motion";

import Container from "../containers/Container";
import Header from "../containers/Header";
import Navigation from "../containers/Navigation";
import Logo from "../containers/Logo";
import Body from "../containers/Body";
import AddListModal from "../containers/AddListModal";
import EditListModal from "../containers/EditListModal";
import EditTaskModal from "../containers/EditTaskModal";
import UserSettingsModal from "../containers/UserSettingsModal";
import InitialListRedirect from "../containers/Redirects/InitialListRedirect";

import { MODAL_ROUTES } from "../constants";

import Helmet from "@components/Helmet";
import SharedProviders from "@hooks/internal/SharedProviders";

const Wrapped = lazy(() => import("../containers/Wrapped"));

// The sidebar stays mounted while switching between pages; each page renders
// its own Helmet, Header and main content into the grid.
function AppLayout() {
  return (
    <Container>
      <Logo />
      <Navigation />
      <Outlet />
    </Container>
  );
}

const modalRoutes = [
  { path: "create-list", element: <AddListModal isOpen={true} /> },
  { path: "edit-list/:section", element: <EditListModal isOpen={true} /> },
  { path: "edit-task/:currentTaskId", element: <EditTaskModal isOpen={true} /> },
  { path: "profile-settings/:section", element: <UserSettingsModal isOpen={true} /> }
];

function ModalRoutes() {
  const element = useRoutes(modalRoutes);
  const { pathname } = useLocation();
  const modalKey = pathname.split("/").find(segment => MODAL_ROUTES.has(segment));
  return <AnimatePresence>{element && <Fragment key={modalKey}>{element}</Fragment>}</AnimatePresence>;
}

const wrappedPage = (
  <>
    <Helmet title="Wrapped" />
    <Header title="Wrapped" />
    <Suspense>
      <Wrapped />
    </Suspense>
    <ModalRoutes />
  </>
);

const CoreApp = () => {
  return (
    <SharedProviders>
      <Routes>
        <Route path="/" element={<InitialListRedirect />} />
        <Route path="/auth/*" element={<Navigate to="/" replace />} />
        <Route element={<AppLayout />}>
          {/* Wrapped redirects a bare /wrapped to the current month. */}
          <Route path="wrapped" element={wrappedPage} />
          <Route path="wrapped/:period/*" element={wrappedPage} />
          <Route
            path=":currentListId/*"
            element={
              <>
                <Helmet />
                <Header />
                <Body />
                <ModalRoutes />
              </>
            }
          />
        </Route>
      </Routes>
    </SharedProviders>
  );
};

export default CoreApp;
