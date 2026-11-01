import { useEffect } from "react";
import { createAuthClient } from "better-auth/react";
import { inferAdditionalFields } from "better-auth/client/plugins";
import { passkeyClient } from "@better-auth/passkey/client";
import { SERVER_URL } from "@utilities/env";
import type { auth } from "../../../api/src/auth";
import type { UpdateProfilePayload } from "../../../api/src/plugins/profileUpdate";

export type { UpdateProfilePayload };

export const authClient = createAuthClient({
  baseURL: SERVER_URL,
  plugins: [passkeyClient(), inferAdditionalFields<typeof auth>()]
});

export const { signIn, signUp } = authClient;

type SessionData = NonNullable<ReturnType<typeof authClient.useSession>["data"]>;

// Last known good session, so a signed-in user who opens the app offline lands
// in the app (with its connection error UI) instead of the login screen. On a
// cold start offline, Better Auth's get-session fetch fails with a network error
// and `data` is null, which is indistinguishable from "logged out" otherwise.
// The session token is stripped: auth relies on the HTTP-only cookie, not this.
const SESSION_CACHE_KEY = "cachedSession";
const DATE_KEYS = new Set(["createdAt", "updatedAt", "expiresAt"]);

function readCachedSession(): SessionData | null {
  try {
    const raw = localStorage.getItem(SESSION_CACHE_KEY);
    if (!raw) {
      return null;
    }
    return JSON.parse(raw, (key, value) =>
      DATE_KEYS.has(key) && typeof value === "string" ? new Date(value) : value
    ) as SessionData;
  } catch {
    return null;
  }
}

function writeCachedSession(data: SessionData) {
  try {
    localStorage.setItem(SESSION_CACHE_KEY, JSON.stringify({ ...data, session: { ...data.session, token: "" } }));
  } catch {
    // Storage full or unavailable; offline fallback just won't be available.
  }
}

function clearCachedSession() {
  localStorage.removeItem(SESSION_CACHE_KEY);
}

export function useSession() {
  const result = authClient.useSession();
  const { data, error, isPending } = result;
  // A non-401 error (network failure, server down) means we couldn't verify the
  // session, not that there isn't one. A 401 or a successful null response means
  // the user is genuinely signed out.
  const isUnverified = Boolean(error) && error?.status !== 401;

  useEffect(() => {
    if (isPending) {
      return;
    }
    if (data) {
      writeCachedSession(data);
    } else if (!isUnverified) {
      clearCachedSession();
    }
  }, [data, isPending, isUnverified]);

  if (!data && isUnverified) {
    const cached = readCachedSession();
    if (cached) {
      return { ...result, data: cached };
    }
  }
  return result;
}

export async function signOut(...args: Parameters<typeof authClient.signOut>) {
  // Clear eagerly: callers typically hard-reload right after signing out, before
  // the session store update would clear it via useSession.
  clearCachedSession();
  return authClient.signOut(...args);
}

// Re-fetch the session into the shared `useSession` store so every consumer
// re-renders with fresh user data. `authClient.getSession()` does NOT do this:
// it's a plain GET whose result is discarded. Better Auth only auto-refreshes
// the store for built-in paths (/update-user, /sign-in/email, ...), so custom
// endpoints called via $fetch (e.g. /update-profile) must refresh explicitly.
export async function refreshSession() {
  await authClient.$store.atoms.session.get().refetch();
}

// Payload accepted by the custom POST /api/auth/update-profile endpoint.
// The type is inferred from the backend Zod schema (see
// api/src/plugins/profileUpdate.ts) so the two can't drift. Unlike
// authClient.updateUser (which only writes declared additionalFields and strips
// unknown keys), this endpoint also persists relational side effects:
// `pushSubscription` (push_subscription table) and `lists` (list_member order).
export async function updateProfile(payload: UpdateProfilePayload) {
  const { data, error } = await authClient.$fetch("/update-profile", {
    method: "POST",
    body: payload
  });
  if (error) {
    throw new Error(error.message || "Failed to update profile");
  }
  return data;
}
