import { createAuthClient } from "better-auth/react";
import { inferAdditionalFields } from "better-auth/client/plugins";
import { passkeyClient } from "@better-auth/passkey/client";
import type { auth } from "../../../api-v2/src/auth";
import type { UpdateProfilePayload } from "../../../api-v2/src/plugins/profileUpdate";

export type { UpdateProfilePayload };

export const authClient = createAuthClient({
  baseURL: "http://localhost:4000",
  plugins: [passkeyClient(), inferAdditionalFields<typeof auth>()]
});

export const { signIn, signUp, signOut, updateUser, useSession } = authClient;

// Payload accepted by the custom POST /api/auth/update-profile endpoint.
// The type is inferred from the backend Zod schema (see
// api-v2/src/plugins/profileUpdate.ts) so the two can't drift. Unlike
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
