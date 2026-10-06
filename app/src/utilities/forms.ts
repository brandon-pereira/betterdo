import type { AnyFieldMeta } from "@tanstack/react-form";

// Surface the first validation message for a TanStack Form field, but only once
// the user has interacted with it (so a pristine form isn't painted red on
// load). Pass `field.state.meta` straight in.
export const fieldError = (meta: AnyFieldMeta): string | undefined =>
  meta.isTouched && !meta.isValid ? meta.errors[0]?.message : undefined;

// Normalize the many error shapes we get back (thrown Errors, better-auth
// `{ error: { message } }`, bare strings) into a single user-facing string.
export const getErrorMessage = (err: unknown, fallback = "An error occurred"): string => {
  if (!err) return fallback;
  if (typeof err === "string") return err || fallback;
  if (err instanceof Error) return err.message || fallback;
  if (typeof err === "object" && "message" in err) {
    const message = (err as { message?: unknown }).message;
    if (typeof message === "string" && message) return message;
  }
  return fallback;
};
