import { lazy, Suspense, useRef } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import { hasOAuthQuery, isOAuthAuthorizationRequest, useSession } from "@utilities/auth";
import CoreApp from "./pages/CoreApp";
import FullScreenLoader from "@components/FullScreenLoader";

// Auth screens are split out of the main chunk since signed-in users (the
// common case) never render them.
const AuthPages = lazy(() => import("./pages/Auth"));
const ResetPassword = lazy(() => import("@components/Auth/ResetPassword"));
const VerifyEmail = lazy(() => import("@components/Auth/VerifyEmail"));
const Consent = lazy(() => import("@components/Auth/Consent"));
const Login = lazy(() => import("@components/Auth/Login"));
const OAuthLinkExpired = lazy(() => import("@components/Auth/OAuthLinkExpired"));

const App = () => {
  const { isPending, data } = useSession();
  const { pathname } = useLocation();

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

  // An MCP client is authorizing and the server sent the user to the login page
  // (the app root, with a signed OAuth query). Keep showing Login even once a
  // session exists: signing in resumes the authorization and the auth client
  // redirects away, and `prompt=login` must work for signed-in users too.
  const isOAuthLogin = pathname === "/" && isOAuthAuthorizationRequest();

  // The signed query has expired: the server would reject every sign-in or
  // consent that carries it, and it would otherwise pin a signed-in user to Login.
  const isOAuthPage = pathname === "/" || pathname === "/auth/consent";
  if (isOAuthPage && hasOAuthQuery() && !isOAuthAuthorizationRequest()) {
    return (
      <Suspense fallback={<FullScreenLoader />}>
        <OAuthLinkExpired />
      </Suspense>
    );
  }

  // These flows are reached via email links and must work regardless of session
  // state. In particular, a Google user setting their first password is already
  // signed in, so the reset screen must not be gated behind the logged-out
  // AuthPages tree (otherwise they land in CoreApp and never see it).
  return (
    <Suspense fallback={<FullScreenLoader />}>
      <Routes>
        <Route path="/auth/reset-password" element={<ResetPassword />} />
        <Route path="/auth/verify-email" element={<VerifyEmail />} />
        {/* Rendered directly (not via AuthPages) so the signed query string survives. */}
        <Route path="/auth/consent" element={data ? <Consent /> : <Login />} />
        <Route path="*" element={data && !isOAuthLogin ? <CoreApp /> : <AuthPages />} />
      </Routes>
    </Suspense>
  );
};

export default App;
