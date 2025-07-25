import { createAuthClient } from "better-auth/react";
import { passkeyClient } from "better-auth/client/plugins";

export const { passkey, signIn, signUp, signOut, useSession } = createAuthClient({
  baseURL: "http://localhost:4000",
  plugins: [passkeyClient()]
});
