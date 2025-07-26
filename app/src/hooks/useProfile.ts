import { useCallback } from "react";

import createSharedHook from "./internal/createSharedHook";

import User from "@customTypes/user";
import { SERVER_URL } from "@utilities/env";
import { useSession } from "@utilities/auth";

function useProfileOnce() {
  const { data, error } = useSession();

  const logout = useCallback(() => {
    window.location.href = `${SERVER_URL}/auth/logout`;
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
