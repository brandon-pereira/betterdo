import { useQuery } from "@tanstack/react-query";

import { getConfigUrl } from "./internal/urls";

interface Config {
  vapidKey: string | null;
  features: Record<string, boolean>;
}

function useConfig() {
  const { data, error } = useQuery<Config>({
    queryKey: [getConfigUrl()],
    staleTime: 600000 // 10min
  });

  if (error) {
    console.error(error);
  }

  return {
    error,
    loading: Boolean(!data),
    config: data,
    vapidKey: data?.vapidKey ?? null,
    features: data?.features ?? {}
  };
}

export default useConfig;
