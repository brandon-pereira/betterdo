import { useSession } from "@utilities/auth";
import CoreApp from "./pages/CoreApp";
import AuthPages from "./pages/Auth";

const App = () => {
  const { isPending, isRefetching, data } = useSession();

  if (isPending && !isRefetching) {
    return <div>Loading...</div>;
  }
  if (!data) {
    return <AuthPages />;
  }
  return <CoreApp />;
};

export default App;
