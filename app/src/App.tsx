import { useSession } from "@utilities/auth";
import Auth from "@components/Auth/Login";
import CoreApp from "./pages/CoreApp";
import AuthPages from "./pages/Auth";

const App = () => {
  const { isPending, data } = useSession();

  if (isPending) {
    return <div>Loading...</div>;
  }
  if (!data) {
    return <AuthPages />;
  }
  return <CoreApp />;
};

export default App;
