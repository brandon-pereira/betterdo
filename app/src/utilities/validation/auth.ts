import { z } from "zod";

// Client-side validation schemas for the auth forms. These mirror the server's
// expectations (better-auth enforces the real constraints) but give users
// immediate, field-level feedback before a round trip.

// Shared field primitives so rules (e.g. min password length) stay consistent
// across sign-up, reset, and change-password.
const emailField = z.string().trim().min(1, "Email is required").email("Enter a valid email");
const passwordField = z.string().min(8, "Password must be at least 8 characters");

export const signUpSchema = z
  .object({
    firstName: z.string().trim().min(1, "First name is required"),
    lastName: z.string().trim(),
    email: emailField,
    password: passwordField,
    confirmPassword: z.string().min(1, "Please confirm your password")
  })
  .refine(data => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"]
  });

export type SignUpValues = z.infer<typeof signUpSchema>;

export const loginSchema = z.object({
  email: emailField,
  // Don't enforce complexity on login — only that something was entered.
  password: z.string().min(1, "Password is required")
});

export type LoginValues = z.infer<typeof loginSchema>;

export const forgotPasswordSchema = z.object({
  email: emailField
});

export type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z
  .object({
    password: passwordField,
    confirmPassword: z.string().min(1, "Please confirm your password")
  })
  .refine(data => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"]
  });

export type ResetPasswordValues = z.infer<typeof resetPasswordSchema>;

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: passwordField,
    confirmPassword: z.string().min(1, "Please confirm your new password")
  })
  .refine(data => data.newPassword === data.confirmPassword, {
    message: "New passwords do not match",
    path: ["confirmPassword"]
  });

export type ChangePasswordValues = z.infer<typeof changePasswordSchema>;
