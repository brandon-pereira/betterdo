import { useMatch } from "react-router-dom";

/** True on the Wrapped (recap) page, which isn't a list. */
function useIsWrappedPage() {
  return Boolean(useMatch({ path: "/wrapped", end: false }));
}

export default useIsWrappedPage;
