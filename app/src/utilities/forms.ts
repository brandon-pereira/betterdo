import type { AnyFieldMeta } from "@tanstack/react-form";

// A single validation error entry can be a plain string or a standard-schema
// issue object ({ message }). Normalize to the message string.
const errorToMessage = (error: unknown): string | undefined => {
  if (!error) return undefined;
  if (typeof error === "string") return error;
  if (typeof error === "object" && "message" in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === "string") return message;
  }
  return undefined;
};

// Surface the first validation message for a TanStack Form field, but only once
// the user has interacted with it (so a pristine form isn't painted red on
// load). Pass `field.state.meta` straight in.
export const fieldError = (meta: AnyFieldMeta): string | undefined => {
  if (!meta.isTouched || meta.isValid) return undefined;
  for (const error of meta.errors) {
    const message = errorToMessage(error);
    if (message) return message;
  }
  return undefined;
};

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
