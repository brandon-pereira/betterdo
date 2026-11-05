import { betterAuth } from "better-auth";
import { createAuthMiddleware, APIError } from "better-auth/api";
import { drizzleAdapter } from "@better-auth/drizzle-adapter/relations-v2";
import { passkey } from "@better-auth/passkey";
import { jwt } from "better-auth/plugins";
import { mcp } from "@better-auth/mcp";
import { cimd } from "@better-auth/cimd";
import { fetchClientMetadataResource } from "@better-auth/cimd/node";
import { db } from "./db.js";
import config from "./config.js";
import * as authSchema from "./schema/auth.js";
import { createInboxForUser } from "./services/lists.js";
import { sendEmail } from "./services/email.js";
import {
  verifyEmailTemplate,
  resetPasswordTemplate,
  passwordChangedTemplate,
  passkeyAddedTemplate,
  passkeyRemovedTemplate
} from "./emails/index.js";
import { getGravatarUrl } from "./utils/gravatar.js";
import { appUrl } from "./utils/appUrl.js";
import { profileUpdatePlugin } from "./plugins/profileUpdate.js";

const forgotPasswordUrl = appUrl("/auth/forgot-password");

/** OAuth protected resource identifier for the MCP endpoint (access token `aud`). */
export const MCP_RESOURCE = new URL("/api/mcp", config.SERVER_URL).toString();
/** The single OAuth scope granting MCP clients access to the user's lists and tasks. */
export const MCP_SCOPE = "tasks";
const accountUrl = config.APP_URL;

/**
 * Fires security notification emails for actions that don't have a
 * dedicated Better Auth callback: changing your password while signed in,
 * and adding/removing a passkey. (The "forgot password" reset flow is
 * covered by `emailAndPassword.onPasswordReset` above instead, since it
 * already hands us the user record.)
 */
const securityEventEmails = createAuthMiddleware(async ctx => {
  if (ctx.context.returned instanceof APIError) {
    // The request failed - nothing to notify about.
    return;
  }

  const sessionUser = ctx.context.session?.user;
  if (!sessionUser) return;

  switch (ctx.path) {
    case "/change-password": {
      await sendEmail({
        to: sessionUser.email,
        ...passwordChangedTemplate({ name: sessionUser.name, resetUrl: forgotPasswordUrl })
      });
      break;
    }
    case "/passkey/verify-registration": {
      const passkeyName = (ctx.context.returned as { name?: string } | undefined)?.name;
      await sendEmail({
        to: sessionUser.email,
        ...passkeyAddedTemplate({ name: sessionUser.name, passkeyName, accountUrl })
      });
      break;
    }
    case "/passkey/delete-passkey": {
      await sendEmail({
        to: sessionUser.email,
        ...passkeyRemovedTemplate({ name: sessionUser.name, accountUrl })
      });
      break;
    }
  }
});

export const auth = betterAuth({
  appName: "BetterDo",
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: authSchema
  }),
  emailVerification: {
    sendVerificationEmail: async ({ user, token }) => {
      const verifyUrl = new URL(appUrl("/auth/verify-email"));
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
    },
    // Covers the "forgot password" reset flow. The in-app "change password"
    // flow (while signed in) has no equivalent callback, so it's handled in
    // `hooks.after` below.
    onPasswordReset: async ({ user }) => {
      await sendEmail({ to: user.email, ...passwordChangedTemplate({ name: user.name, resetUrl: forgotPasswordUrl }) });
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
  trustedOrigins: [config.SERVER_URL, config.APP_URL],
  hooks: {
    after: securityEventEmails
  },
  // The jwt plugin's session-token endpoint isn't needed (OAuth access tokens are
  // minted by /oauth2/token) and would hand out tokens signed by the same keys.
  disabledPaths: ["/token"],
  plugins: [
    passkey(),
    profileUpdatePlugin(),
    // Signing keys + /jwks for OAuth access tokens.
    jwt({ disableSettingJwtHeader: true }),
    // OAuth 2.1 authorization server for MCP clients (MCP 2026-07-28 profile).
    mcp({
      resource: MCP_RESOURCE,
      scopes: [MCP_SCOPE, "offline_access"],
      // The login and consent screens live in the SPA, which may be on another
      // origin, so these must be absolute URLs.
      loginPage: appUrl("/"),
      consentPage: appUrl("/auth/consent"),
      // CIMD is the 2026-07-28 way for clients to identify themselves. Dynamic
      // Client Registration is kept as a fallback for clients that predate it
      // (e.g. Cursor); "infer" accepts their native/loopback redirect URIs.
      allowDynamicClientRegistration: true,
      allowUnauthenticatedClientRegistration: true,
      clientRegistrationDefaultApplicationType: "infer"
    }),
    cimd({ fetchClientMetadataResource, metadataProfile: "mcp-2026-07-28" })
  ],
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
