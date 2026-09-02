import { createAuthEndpoint, sessionMiddleware } from "better-auth/api";
import type { BetterAuthPlugin } from "better-auth";
import * as z from "zod";
import { updateUser } from "../services/users.js";
import { getNotifier } from "../notifier.js";

// Body accepted by POST /api/auth/update-profile.
//
// Better Auth's built-in `updateUser` only writes columns declared in
// `additionalFields`, and it strips any unknown keys before hooks run. Our
// `pushSubscription` (separate `push_subscription` table) and `lists`
// (positions in `list_member`) are relational side effects, so they can't go
// through the standard `updateUser`. This dedicated endpoint forwards the whole
// payload to the `updateUser` service which handles those relations (including
// dedupe-by-endpoint insert so a user can register multiple devices).
const updateProfileBodySchema = z.object({
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  email: z.string().optional(),
  timeZone: z.string().optional(),
  customLists: z.record(z.string(), z.boolean()).optional(),
  isBeta: z.boolean().optional(),
  isPushEnabled: z.boolean().optional(),
  // JSON-stringified PushSubscription from the browser
  pushSubscription: z.string().optional(),
  // Ordered list of the user's non-inbox list IDs
  lists: z.array(z.string()).optional()
});

// Shared type for the update-profile body. Import this on the client so the
// frontend payload type stays in sync with the backend Zod schema.
export type UpdateProfilePayload = z.infer<typeof updateProfileBodySchema>;

export function profileUpdatePlugin() {
  return {
    id: "profile-update",
    endpoints: {
      updateProfile: createAuthEndpoint(
        "/update-profile",
        {
          method: "POST",
          body: updateProfileBodySchema,
          use: [sessionMiddleware]
        },
        async c => {
          const sessionUser = c.context.session.user;

          try {
            const updatedUser = await updateUser(c.body, {
              user: { id: sessionUser.id, name: sessionUser.name },
              notifier: getNotifier()
            });
            return c.json(updatedUser);
          } catch (err) {
            throw c.error("BAD_REQUEST", {
              message: err instanceof Error ? err.message : "Invalid profile update"
            });
          }
        }
      )
    }
  } satisfies BetterAuthPlugin;
}
