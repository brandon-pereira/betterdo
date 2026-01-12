import { useCallback } from "react";
import { mutate } from "swr";

import { getListsUrl, getProfileUrl } from "./internal/urls";

import { _UpdateUserPayload, UpdateUserObject } from "@customTypes/user";
import { updateUser } from "@utilities/auth";

function useModifyProfile() {
  return useCallback(async (updatedProps: UpdateUserObject) => {
    const formattedProps = { ...updatedProps } as _UpdateUserPayload;
    if (updatedProps.lists) {
      await mutate(getListsUrl(), async () => updatedProps.lists, false);
      formattedProps.lists = updatedProps.lists.filter(t => t.type === "default").map(t => t.id);
    }
    await updateUser(getAuthPropsFromUpdatePayload(formattedProps));
    await mutate(getProfileUrl());
    if (updatedProps.lists || updatedProps?.customLists) {
      await mutate(getListsUrl());
    }
  }, []);
}

const AUTH_KEYS: (keyof _UpdateUserPayload)[] = [
  "timeZone",
  "isBeta",
  "profilePicture",
  "isPushEnabled",
  "customLists"
];
function getAuthPropsFromUpdatePayload(payload: _UpdateUserPayload) {
  const authProps: Record<string, unknown> = {};
  if (payload.firstName && payload.lastName) {
    authProps.name = [payload.firstName, payload.lastName].filter(Boolean).join(" ");
  }
  for (const key of AUTH_KEYS) {
    if (key in payload) {
      authProps[key] = payload[key];
    }
  }
  return authProps;
}

export default useModifyProfile;
