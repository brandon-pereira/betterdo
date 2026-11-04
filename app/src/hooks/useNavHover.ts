import { useState } from "react";

import createSharedHook from "./internal/createSharedHook";

function useNavHoverOnce(): [string | null, (id: string | null) => void] {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  return [hoveredId, setHoveredId];
}

const { Provider: NavHoverProvider, useConsumer: useNavHover } = createSharedHook(useNavHoverOnce);

export { NavHoverProvider };
export default useNavHover;
