import { z } from "zod";
import { emailSchema, listTitleSchema, taskTitleSchema } from "@betterdo/shared/validation";

// Client-side validation for list forms. Title rules come from the shared
// package so they match what the API enforces.

export const listSettingsSchema = z.object({
  title: listTitleSchema,
  color: z.string()
});

export const addMemberSchema = z.object({
  email: emailSchema
});

export const addTaskSchema = z.object({
  title: taskTitleSchema
});
