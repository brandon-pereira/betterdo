import { useSession } from "@utilities/auth";
import CoreApp from "./pages/CoreApp";
import AuthPages from "./pages/Auth";
import FullScreenLoader from "@components/FullScreenLoader";

const App = () => {
  const { isPending, isRefetching, data } = useSession();

  // Show the loader whenever a session request is in flight (initial load OR a
  // post-login refetch). Without checking isRefetching here, the brief window
  // where a refetch is running with data still null would flash the login form.
  if ((isPending || isRefetching) && !data) {
    return <FullScreenLoader />;
  }
  if (!data) {
    return <AuthPages />;
  }
  return <CoreApp />;
};

export default App;
