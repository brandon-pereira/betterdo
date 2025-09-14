import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { passkey } from "better-auth/plugins/passkey";
import { db } from "./db.js";
import config from "./config.js";
import * as authSchema from "./schema/auth.js";
import { createInboxForUser } from "./services/lists.js";

export const auth = betterAuth({
  appName: "BetterDo",
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
  databaseHooks: {
    user: {
      create: {
        after: async user => {
          await createInboxForUser(user.id);
        }
      }
    }
  },
  trustedOrigins: ["http://localhost:4000", "http://localhost:4001"],
  plugins: [passkey()],
  user: {
    additionalFields: {
      timeZone: {
        type: "string",
        required: true,
        defaultValue: "America/New_York"
      },
      // customLists: {
      //   type: "object",
      //   required: false,
      //   defaultValue: {
      //     highPriority: false,
      //     today: false,
      //     tomorrow: false,
      //     overdue: false,
      //     week: false
      //   }
      // },
      isBeta: {
        type: "boolean",
        required: true,
        defaultValue: false
      },
      isPushEnabled: {
        type: "boolean",
        required: false,
        defaultValue: false
      },
      vapidKey: {
        type: "string",
        required: false
      }
    }
  }
});
