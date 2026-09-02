import { useRef } from "react";
import { useSession } from "@utilities/auth";
import CoreApp from "./pages/CoreApp";
import AuthPages from "./pages/Auth";
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
  if (!data) {
    return <AuthPages />;
  }
  return <CoreApp />;
};

export default App;
