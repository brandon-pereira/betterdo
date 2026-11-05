import { useCallback } from "react";
import useSWR from "swr";

import { getConnectedAppsUrl } from "./internal/urls";
import { disconnectApp } from "@utilities/server";

/** An app (e.g. an AI assistant) the user authorized to access their account over MCP. */
interface ConnectedApp {
  clientId: string;
  name: string | null;
  icon: string | null;
  uri: string | null;
  scopes: string[];
  connectedAt: string | null;
  lastActiveAt: string | null;
}

function useConnectedApps() {
  const { data, error, mutate } = useSWR<ConnectedApp[]>(getConnectedAppsUrl());

  const disconnect = useCallback(
    async (clientId: string) => {
      await disconnectApp(clientId);
      await mutate(apps => apps?.filter(app => app.clientId !== clientId), { revalidate: true });
    },
    [mutate]
  );

  return {
    error,
    loading: !data && !error,
    apps: data ?? [],
    disconnect
  };
}

export default useConnectedApps;
