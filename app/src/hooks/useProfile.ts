import { useCallback } from "react";

import createSharedHook from "./internal/createSharedHook";

import User from "@customTypes/user";
import { signOut, useSession } from "@utilities/auth";

function useProfileOnce() {
  const { data, error } = useSession();

  const logout = useCallback(() => {
    signOut();
  }, []);

  return {
    logout,
    error,
    loading: Boolean(!data),
    profile: {
      id: data?.user.id || "",
      firstName: data?.user.name || "",
      lastName: data?.user.name || "",
      email: data?.user.email || "",
      profilePicture: data?.user.image || "",
      lastLogin: data?.session.updatedAt || new Date(),
      creationDate: data?.user.createdAt || new Date()
    } satisfies User
  };
}

const { Provider, useConsumer: useProfile } = createSharedHook(useProfileOnce);

export { Provider as ProfileProvider };
export default useProfile;
