import { useCallback } from "react";
import { useSWRConfig } from "swr";

import createSharedHook from "./internal/createSharedHook";

import User from "@customTypes/user";
import { signOut, useSession } from "@utilities/auth";
import { pick } from "radash";

function useProfileOnce() {
  const { data, error } = useSession();
  const { mutate } = useSWRConfig();

  const logout = useCallback(async () => {
    await signOut();
    // Reset every SWR key through SWR's own API so its internal revalidation
    // state (revalidators + dedupe registry) is reset too. A direct
    // cache.clear() only empties the data Map and leaves that internal state
    // intact, which strands keys so they never re-fetch after a subsequent
    // login (the app would then hang loading lists/details until a full reload).
    await mutate(() => true, undefined, { revalidate: false });
  }, [mutate]);

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
      ...pick(data.user, ["id", "email", "image", "isPushEnabled", "isBeta", "timeZone"]),
      firstName: data.user.name.split(" ")[0] || "",
      lastName: data.user.name.split(" ").slice(1).join(" ") || "",
      profilePicture: data.user.image,
      lastLogin: data?.session.updatedAt,
      creationDate: data?.user.createdAt,
      isPushEnabled: !!data.user.isPushEnabled,
      customLists: data.user.customLists || {},
      isBeta: !!data.user.isBeta
    } satisfies User
  };
}

const { Provider, useConsumer: useProfile } = createSharedHook(useProfileOnce);

export { Provider as ProfileProvider };
export default useProfile;
