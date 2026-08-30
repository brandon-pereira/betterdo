import { betterAuth } from "better-auth";
import { drizzleAdapter } from "@better-auth/drizzle-adapter/relations-v2";
import { passkey } from "@better-auth/passkey";
import { db } from "./db.js";
import config from "./config.js";
import * as authSchema from "./schema/auth.js";
import { createInboxForUser } from "./services/lists.js";
import { sendEmail } from "./services/email.js";
import { verifyEmailTemplate, resetPasswordTemplate } from "./emails/index.js";
import { getGravatarUrl } from "./utils/gravatar.js";
import { profileUpdatePlugin } from "./plugins/profileUpdate.js";

export const auth = betterAuth({
  appName: "BetterDo",
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: authSchema
  }),
  emailVerification: {
    sendVerificationEmail: async ({ user, token }) => {
      const verifyUrl = new URL("/auth/verify-email", config.APP_URL);
      verifyUrl.searchParams.set("token", token);
      await sendEmail({
        to: user.email,
        ...verifyEmailTemplate({ url: verifyUrl.toString(), name: user.name })
      });
    },
    sendOnSignIn: true,
    autoSignInAfterVerification: true
  },
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,

    sendResetPassword: async ({ user, url }) => {
      await sendEmail({ to: user.email, ...resetPasswordTemplate({ url, name: user.name }) });
    }
  },
  socialProviders: {
    google: {
      clientId: config.GOOGLE_CLIENT_ID,
      clientSecret: config.GOOGLE_CLIENT_SECRET
    }
  },
  databaseHooks: {
    user: {
      create: {
        before: async user => {
          if (!user.image) {
            user.image = getGravatarUrl(user.email);
          }
        },
        after: async user => {
          // The user row is already committed at this point. If inbox
          // creation throws here, better-auth turns it into an opaque 500
          // (bypassing Hono's onError)
          try {
            await createInboxForUser(user.id);
          } catch (err) {
            console.error("[auth] failed to create inbox for user", user.id, err);
          }
        }
      },
      update: {
        before: async newData => {
          if (newData.email) {
            newData.image = getGravatarUrl(newData.email);
          }
        }
      }
    }
  },
  trustedOrigins: ["http://localhost:4000", "http://localhost:4001"],
  plugins: [passkey(), profileUpdatePlugin()],
  user: {
    additionalFields: {
      timeZone: {
        type: "string",
        required: true,
        defaultValue: "America/New_York"
      },
      customLists: {
        type: "json",
        required: false
        // TODO: Default value doesn't work for json atm
        // https://github.com/better-auth/better-auth/issues/7275
        // defaultValue: () => ({
        //   highPriority: false,
        //   today: false,
        //   tomorrow: false,
        //   overdue: false,
        //   week: false
        // })
      },
      isBeta: {
        type: "boolean",
        required: false,
        defaultValue: false
      },
      isPushEnabled: {
        type: "boolean",
        required: false,
        defaultValue: false
      }
    }
  }
});
