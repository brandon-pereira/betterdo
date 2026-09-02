import useSWR from "swr";

import { getConfigUrl } from "./internal/urls";

interface Config {
  vapidKey: string | null;
  features: Record<string, boolean>;
}

function useConfig() {
  const { data, error } = useSWR<Config>(getConfigUrl(), {
    dedupingInterval: 600000 // 10min
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
