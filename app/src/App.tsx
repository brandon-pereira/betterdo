import { useRef } from "react";
import { Routes, Route } from "react-router-dom";
import { useSession } from "@utilities/auth";
import CoreApp from "./pages/CoreApp";
import AuthPages from "./pages/Auth";
import ResetPassword from "@components/Auth/ResetPassword";
import VerifyEmail from "@components/Auth/VerifyEmail";
import FullScreenLoader from "@components/FullScreenLoader";

const App = () => {
  const { isPending, data } = useSession();

  // Only show the loader on the initial session resolution. Blocking on later
  // background refetches would unmount the current view mid-flow, flashing the
  // login form and wiping in-progress state (e.g. the post-signup screen).
  const hasResolved = useRef(false);
  if (!isPending) {
    hasResolved.current = true;
  }

  if (isPending && !hasResolved.current) {
    return <FullScreenLoader />;
  }

  // These flows are reached via email links and must work regardless of session
  // state. In particular, a Google user setting their first password is already
  // signed in, so the reset screen must not be gated behind the logged-out
  // AuthPages tree (otherwise they land in CoreApp and never see it).
  return (
    <Routes>
      <Route path="/auth/reset-password" element={<ResetPassword />} />
      <Route path="/auth/verify-email" element={<VerifyEmail />} />
      <Route path="*" element={data ? <CoreApp /> : <AuthPages />} />
    </Routes>
  );
};

export default App;
