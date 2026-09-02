import { Hono } from "hono";
import config from "../config.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";

const configApi = new Hono();

// Authenticated client-facing configuration. Home for values the browser needs
// that aren't part of the user record: the VAPID *public* key (server identity)
// and feature flags.
//
// Gated behind auth so per-user feature flags can be resolved from the session
// user without reworking the route. App-wide flags live in `features`; layer in
// user-specific overrides here as they're introduced.
configApi.get("/", authMiddleware, c => {
  const user = c.get("user");

  return c.json({
    vapidKey: config.VAPID_PUBLIC_KEY || null,
    // Feature flags resolved for the authenticated user.
    features: resolveUserFeatures(user)
  });
});

// Per-user feature resolution. Add flags here as they're introduced, deriving
// from the session user (e.g. `someBetaFeature: Boolean(user.isBeta)`).
function resolveUserFeatures(user: { id: string; isBeta?: boolean | null }): Record<string, boolean> {
  void user;
  return {};
}

export default configApi;
