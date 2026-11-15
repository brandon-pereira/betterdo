import { useCallback } from "react";
import { useNavigate } from "react-router-dom";

import useProfile from "@hooks/useProfile";
import { addList } from "@utilities/listCache";
import { queueChange } from "@utilities/offlineQueue";

function useCreateList() {
  const navigate = useNavigate();
  const { profile } = useProfile();
  return useCallback(
    async (title: string, color: string) => {
      // Generated here so the list can be opened and filled before the server
      // has seen it, e.g. while offline.
      const id = crypto.randomUUID();
      addList({
        id,
        title,
        color,
        type: "default",
        tasks: [],
        members: profile ? [profile] : [],
        owner: profile?.id ?? ""
      });
      const created = queueChange("createList", { id, title, color });
      navigate(`/${id}`);
      await created;
    },
    [navigate, profile]
  );
}

export default useCreateList;
