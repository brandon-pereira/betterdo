import type { Context } from "hono";
import { z } from "zod";

interface ValidationResult {
  success: boolean;
  error?: z.core.$ZodError;
}

// zValidator hook: on failure, return a 400 with a readable message. The app's
// ServerError surfaces `formattedMessage` to the user.
export const validationErrorHook = (result: ValidationResult, c: Context) => {
  if (!result.success && result.error) {
    return c.json(
      {
        error: "Invalid request data",
        formattedMessage: z.prettifyError(result.error)
      },
      400
    );
  }
};
