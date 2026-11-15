import { useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";

import { getListsUrl } from "./internal/urls";

import List from "@customTypes/list";
import { deleteList } from "@utilities/server";

function useDeleteList() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  return useCallback(
    async (listId: string) => {
      const queryKey = [getListsUrl()];
      queryClient.setQueryData<List[]>(queryKey, lists => lists?.filter(list => list.id !== listId));
      try {
        await deleteList(listId);
      } catch (err) {
        await queryClient.invalidateQueries({ queryKey });
        throw err;
      }
      await queryClient.invalidateQueries({ queryKey });
      navigate("/");
    },
    [navigate, queryClient]
  );
}

export default useDeleteList;
