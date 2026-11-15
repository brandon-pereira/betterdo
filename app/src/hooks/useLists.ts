import { useQuery } from "@tanstack/react-query";

import createSharedHook from "./internal/createSharedHook";
import { getListsUrl } from "./internal/urls";

import List from "@customTypes/list";

function useListsOnce() {
  const { data, error } = useQuery<List[]>({
    queryKey: [getListsUrl()],
    staleTime: 600000 //10min
  });

  if (error) {
    console.error(error);
  }
  return {
    error,
    loading: Boolean(!data),
    lists: data ? data : []
  };
}

const { Provider: ListsProvider, useConsumer: useLists } = createSharedHook(useListsOnce);

export { ListsProvider };
export default useLists;
