import useSWR from "swr";

import { getWrappedUrl } from "./internal/urls";

import type { WrappedSummary } from "../../../api/src/services/wrapped";

function useWrapped(periodKey: string) {
  const { data, error } = useSWR<WrappedSummary>(getWrappedUrl(periodKey), {
    // Past periods are effectively static; avoid refetching while browsing.
    dedupingInterval: 600000, // 10min
    revalidateOnFocus: false
  });

  if (error) {
    console.error(error);
  }

  return {
    error,
    loading: Boolean(!data && !error),
    data
  };
}

export default useWrapped;
