import { z } from "zod";
import { emailSchema, passwordSchema } from "@betterdo/shared/validation";

// Client-side validation schemas for the auth forms. These compose shared
// primitives (so rules like password length stay in lockstep with the API) with
// client-only concerns like confirm-password matching and friendlier messaging.

export const signUpSchema = z
  .object({
    firstName: z.string().trim().min(1, "First name is required"),
    lastName: z.string().trim(),
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string().min(1, "Please confirm your password")
  })
  .refine(data => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"]
  });

export const loginSchema = z.object({
  email: emailSchema,
  // Don't enforce complexity on login — only that something was entered.
  password: z.string().min(1, "Password is required")
});

export const forgotPasswordSchema = z.object({
  email: emailSchema
});

export const resetPasswordSchema = z
  .object({
    password: passwordSchema,
    confirmPassword: z.string().min(1, "Please confirm your password")
  })
  .refine(data => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"]
  });

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: passwordSchema,
    confirmPassword: z.string().min(1, "Please confirm your new password")
  })
  .refine(data => data.newPassword === data.confirmPassword, {
    message: "New passwords do not match",
    path: ["confirmPassword"]
  });
