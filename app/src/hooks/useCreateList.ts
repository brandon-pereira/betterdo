import { useCallback } from "react";
import { useSWRConfig } from "swr";
import { useNavigate } from "react-router-dom";

import { getListsUrl } from "./internal/urls";

import List from "@customTypes/list";
import { createList } from "@utilities/server";

function useCreateList() {
  const { mutate } = useSWRConfig();

  const navigate = useNavigate();
  return useCallback(
    async (title: string, color: string) => {
      // The server keeps this id, so the placeholder already has the list's real id
      const id = crypto.randomUUID();
      await mutate(
        getListsUrl(),
        async (lists?: List[]) => {
          return [
            ...(lists || []),
            {
              id,
              title,
              color
            }
          ] as List[];
        },
        false
      );
      const list = await createList({ id, title, color });
      navigate(`/${list.id}`);
      await mutate(getListsUrl());
    },
    [navigate, mutate]
  );
}

export default useCreateList;
