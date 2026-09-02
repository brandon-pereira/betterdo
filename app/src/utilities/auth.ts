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

export const { signIn, signUp, signOut, useSession } = authClient;

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
