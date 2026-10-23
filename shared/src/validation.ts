import { z } from "zod";
import { LIST_TITLE_MAX_LENGTH, PRIORITIES, TASK_TITLE_MAX_LENGTH } from "./constants.ts";

// Zod schema for task priority, built from the shared PRIORITIES constant.
export const prioritySchema = z.enum(PRIORITIES);

// A required, trimmed title capped at `max` characters (checked after trimming).
const titleSchema = (max: number) =>
  z.string().trim().min(1, "Title is required").max(max, `Title must be at most ${max} characters`);

export const taskTitleSchema = titleSchema(TASK_TITLE_MAX_LENGTH);
export const listTitleSchema = titleSchema(LIST_TITLE_MAX_LENGTH);

// Minimum password length enforced on sign-up, reset, and change-password.
export const PASSWORD_MIN_LENGTH = 8;
export const passwordSchema = z
  .string()
  .min(PASSWORD_MIN_LENGTH, `Password must be at least ${PASSWORD_MIN_LENGTH} characters`);

// A trimmed, valid email address.
export const emailSchema = z.string().trim().min(1, "Email is required").email("Enter a valid email");

// A date string the backend can parse (frontend sends RFC-1123 via
// Date.prototype.toUTCString, not strict ISO-8601).
export const dateStringSchema = z.string().refine(value => !Number.isNaN(new Date(value).getTime()), {
  message: "Invalid date"
});
