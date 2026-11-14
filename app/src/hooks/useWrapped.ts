import useSWR from "swr";

import { getWrappedUrl } from "./internal/urls";

import { getWrapped } from "@utilities/server";
import { parsePeriodKey } from "@utilities/wrappedPeriod";

// Converts a page URL key ("2026-10", "2026" or "all-time") into the API's request body.
function toWrappedPeriod(periodKey: string) {
  const period = parsePeriodKey(periodKey);
  if (!period || period.type === "all-time") {
    return { all: true } as const;
  }
  return period.type === "year" ? { year: period.year } : { year: period.year, month: period.month };
}

function useWrapped(periodKey: string) {
  // The period is part of the key so each one is cached separately.
  const { data, error } = useSWR([getWrappedUrl(), periodKey], () => getWrapped(toWrappedPeriod(periodKey)), {
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
