import { SWRConfig } from "swr";

import { fetcher } from "./fetcher";

function SWRProvider({ children }: { children: React.ReactChild }) {
  return <SWRConfig value={{ fetcher }}>{children}</SWRConfig>;
}

export default SWRProvider;
