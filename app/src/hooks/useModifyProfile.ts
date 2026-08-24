import { useCallback } from "react";
import { mutate } from "swr";

import { getListsUrl, getProfileUrl } from "./internal/urls";

import { _UpdateUserPayload, UpdateUserObject } from "@customTypes/user";
import { updateProfile, UpdateProfilePayload } from "@utilities/auth";

function useModifyProfile() {
  return useCallback(async (updatedProps: UpdateUserObject) => {
    const formattedProps = { ...updatedProps } as _UpdateUserPayload;
    if (updatedProps.lists) {
      await mutate(getListsUrl(), async () => updatedProps.lists, false);
      formattedProps.lists = updatedProps.lists.filter(t => t.type === "default").map(t => t.id);
    }
    await updateProfile(getProfilePropsFromUpdatePayload(formattedProps));
    await mutate(getProfileUrl());
    if (updatedProps.lists || updatedProps?.customLists) {
      await mutate(getListsUrl());
    }
  }, []);
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
