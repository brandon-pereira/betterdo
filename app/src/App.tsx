import { useSession } from "@utilities/auth";
import Auth from "@components/Auth/Auth";
import CoreApp from "./pages/CoreApp";

const App = () => {
  const { isPending, data } = useSession();

  if (isPending) {
    return <div>Loading...</div>;
  }
  if (!data) {
    return <Auth />;
  }
  return <CoreApp />;
};

export default App;
