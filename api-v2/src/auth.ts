import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { passkey } from "@better-auth/passkey";
import { db } from "./db.js";
import config from "./config.js";
import * as authSchema from "./schema/auth.js";
import { createInboxForUser } from "./services/lists.js";
import { sendEmail } from "./services/email.js";
import { getGravatarUrl } from "./utils/gravatar.js";
import { profileUpdatePlugin } from "./plugins/profileUpdate.js";

export const auth = betterAuth({
  appName: "BetterDo",
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: authSchema
  }),
  //   emailVerification: {
  //   sendVerificationEmail: async ({ user, url }) => {
  //     void sendEmail({
  //       to: user.email,
  //       subject: "Verify your email address",
  //       text: `Click the link to verify your email: ${url}`,
  //     });
  //   },
  //   sendOnSignIn: true,
  // },
  // emailAndPassword: {
  // },
  emailAndPassword: {
    enabled: true,
    //  autoSignInAfterVerification: true,
    // requireEmailVerification: true,

    sendResetPassword: async ({ user, url }) => {
      await sendEmail({
        to: user.email,
        subject: "Reset your password",
        html: `<p>Click the link below to reset your password:</p><p><a href="${url}">${url}</a></p>`
      });
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
          await createInboxForUser(user.id);
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
