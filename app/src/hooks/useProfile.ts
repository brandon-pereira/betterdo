import { useCallback } from "react";

import createSharedHook from "./internal/createSharedHook";

import User from "@customTypes/user";
import { signOut, useSession } from "@utilities/auth";
import { pick } from "radash";

function useProfileOnce() {
  const { data, error } = useSession();

  const logout = useCallback(() => {
    signOut();
  }, []);

  if (error) {
    return {
      logout,
      error: error.message,
      loading: false,
      profile: null
    };
  }

  if (!data) {
    return {
      logout,
      error,
      loading: true,
      profile: null
    };
  }

  return {
    logout,
    error,
    loading: false,
    profile: {
      ...pick(data.user, ["id", "email", "image", "vapidKey", "isPushEnabled", "isBeta", "timeZone"]),
      firstName: data.user.name.split(" ")[0] || "",
      lastName: data.user.name.split(" ").slice(1).join(" ") || "",
      profilePicture: data.user.image,
      lastLogin: data?.session.updatedAt,
      creationDate: data?.user.createdAt,
      customLists: {},
      isBeta: !!data.user.isBeta
    } satisfies User
  };
}

const { Provider, useConsumer: useProfile } = createSharedHook(useProfileOnce);

export { Provider as ProfileProvider };
export default useProfile;
