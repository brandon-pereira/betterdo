import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { passkey } from "better-auth/plugins/passkey";
import { db } from "./db.js";
import config from "./config.js";
import * as authSchema from "./schema/auth.js";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: authSchema
  }),
  emailAndPassword: {
    enabled: true
  },
  socialProviders: {
    google: {
      clientId: config.GOOGLE_CLIENT_ID,
      clientSecret: config.GOOGLE_CLIENT_SECRET
    }
  },
  plugins: [passkey()]
});
