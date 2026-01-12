import { createAuthClient } from "better-auth/react";
import { inferAdditionalFields } from "better-auth/client/plugins";
import { passkeyClient } from "@better-auth/passkey/client";
import type { auth } from "../../../api-v2/src/auth";

export const authClient = createAuthClient({
  baseURL: "http://localhost:4000",
  plugins: [passkeyClient(), inferAdditionalFields<typeof auth>()]
});

export const { signIn, signUp, signOut, updateUser, useSession } = authClient;
