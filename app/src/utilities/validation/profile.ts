import { z } from "zod";
import { emailSchema } from "@betterdo/shared/validation";

// Client-side validation for the profile form.

export const profileSchema = z.object({
  firstName: z.string().trim().min(1, "First name is required"),
  lastName: z.string().trim(),
  email: emailSchema
});
