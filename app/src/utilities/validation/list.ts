import { z } from "zod";
import { emailSchema } from "@betterdo/shared/validation";

// Client-side validation for list forms. The server enforces the real
// constraints; these give immediate field-level feedback.

export const listSettingsSchema = z.object({
  title: z.string().trim().min(1, "List name is required"),
  color: z.string()
});

export const addMemberSchema = z.object({
  email: emailSchema
});

export const addTaskSchema = z.object({
  title: z.string().trim().min(1, "Task title is required")
});
