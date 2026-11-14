import { lazy, Suspense } from "react";
import { Routes, Route, Navigate, Outlet } from "react-router-dom";
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

const CoreApp = () => {
  return (
    <SharedProviders>
      <Routes>
        <Route path="/" element={<InitialListRedirect />} />
        <Route path="/auth/*" element={<Navigate to="/" replace />} />
        <Route element={<AppLayout />}>
          <Route
            path="wrapped/:period?"
            element={
              <>
                <Helmet title="Wrapped" />
                <Header title="Wrapped" />
                <Suspense>
                  <Wrapped />
                </Suspense>
              </>
            }
          />
          <Route
            path=":currentListId/*"
            element={
              <>
                <Helmet />
                <Header />
                <Body />
                <AnimatePresence>
                  {/* 
                      We can get unmount animations once this open issue is resolved:
                      I've previously added   <Routes location={location} key={location.pathname}>
                      which works but causes app to error when you change lists. No good.
                      https://github.com/remix-run/react-router/issues/7117 
                  */}
                  <Routes>
                    <Route element={<AddListModal isOpen={true} />} path="create-list" key="create-list" />
                    <Route element={<EditListModal isOpen={true} />} path="edit-list/:section" />
                    <Route element={<EditTaskModal isOpen={true} />} path="edit-task/:currentTaskId" />
                    <Route element={<UserSettingsModal isOpen={true} />} path="profile-settings/:section" />
                  </Routes>
                </AnimatePresence>
              </>
            }
          />
        </Route>
      </Routes>
    </SharedProviders>
  );
};

export default CoreApp;
