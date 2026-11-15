import { useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

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
  const queryClient = useQueryClient();
  const { data, error } = useQuery<ConnectedApp[]>({ queryKey: [getConnectedAppsUrl()] });

  const disconnect = useCallback(
    async (clientId: string) => {
      await disconnectApp(clientId);
      const queryKey = [getConnectedAppsUrl()];
      queryClient.setQueryData<ConnectedApp[]>(queryKey, apps => apps?.filter(app => app.clientId !== clientId));
      await queryClient.invalidateQueries({ queryKey });
    },
    [queryClient]
  );

  return {
    error,
    loading: !data && !error,
    apps: data ?? [],
    disconnect
  };
}

export default useConnectedApps;
