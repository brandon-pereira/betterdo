import { useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";

import { getListsUrl } from "./internal/urls";

import List from "@customTypes/list";
import { _UpdateUserPayload, UpdateUserObject } from "@customTypes/user";
import { refreshSession, updateProfile, UpdateProfilePayload } from "@utilities/auth";

function useModifyProfile() {
  const queryClient = useQueryClient();
  return useCallback(
    async (updatedProps: UpdateUserObject) => {
      const formattedProps = { ...updatedProps } as _UpdateUserPayload;
      if (updatedProps.lists) {
        queryClient.setQueryData<List[]>([getListsUrl()], updatedProps.lists);
        formattedProps.lists = updatedProps.lists.filter(t => t.type === "default").map(t => t.id);
      }
      await updateProfile(getProfilePropsFromUpdatePayload(formattedProps));
      // Refresh the shared session store so consumers re-render with the persisted values.
      await refreshSession();
      if (updatedProps.lists || updatedProps?.customLists) {
        await queryClient.invalidateQueries({ queryKey: [getListsUrl()] });
      }
    },
    [queryClient]
  );
}

// Fields forwarded to the /update-profile endpoint. Includes the relational
// side effects (pushSubscription, lists) that the old authClient.updateUser
// path silently dropped.
const PROFILE_KEYS: (keyof UpdateProfilePayload)[] = [
  "firstName",
  "lastName",
  "email",
  "timeZone",
  "customLists",
  "isBeta",
  "isPushEnabled",
  "pushSubscription",
  "lists"
];
function getProfilePropsFromUpdatePayload(payload: _UpdateUserPayload) {
  const profileProps: UpdateProfilePayload = {};
  for (const key of PROFILE_KEYS) {
    if (key in payload && payload[key] !== undefined) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (profileProps as any)[key] = payload[key];
    }
  }
  return profileProps;
}

export default useModifyProfile;
