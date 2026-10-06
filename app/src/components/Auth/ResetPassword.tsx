import { useState } from "react";
import { useForm } from "@tanstack/react-form";
import { useSearchParams } from "react-router-dom";
import AuthContainer from "./AuthContainer";
import PasswordInput from "./PasswordInput";
import { authClient } from "@utilities/auth";
import { AuthButtons, Stack, Group, Alert, AlertTitle } from "./Auth.styles";
import Button from "@components/Button";
import Link from "@components/Link";
import { resetPasswordSchema } from "@utilities/validation/auth";
import { fieldError, getErrorMessage } from "@utilities/forms";

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [succeeded, setSucceeded] = useState(false);

  const token = searchParams.get("token");
  const invalidToken = !token;

  const form = useForm({
    defaultValues: { password: "", confirmPassword: "" },
    validators: { onChange: resetPasswordSchema },
    onSubmit: async ({ value }) => {
      setError(null);
      setLoading(true);
      try {
        const { error } = await authClient.resetPassword({
          newPassword: value.password,
          token: token!
        });
        setLoading(false);
        if (error) {
          setError(getErrorMessage(error, "An error occurred. The link may have expired."));
        } else {
          setSucceeded(true);
        }
      } catch (err: unknown) {
        setLoading(false);
        setError(getErrorMessage(err));
      }
    }
  });

  if (invalidToken) {
    return (
      <AuthContainer title="Invalid Link">
        <Alert $color="red">
          <AlertTitle>Error</AlertTitle>
          This password reset link is invalid or has expired.
        </Alert>
        <AuthButtons>
          <Link to="/">Back to Login</Link>
        </AuthButtons>
      </AuthContainer>
    );
  }

  if (succeeded) {
    return (
      <AuthContainer title="Password Reset">
        <Alert $color="green">
          <AlertTitle>Success</AlertTitle>
          Your password has been reset successfully. You can now log in with your new password.
        </Alert>
        <AuthButtons>
          <Link to="/">Back to Login</Link>
        </AuthButtons>
      </AuthContainer>
    );
  }

  return (
    <AuthContainer title="Reset Your Password">
      <form
        onSubmit={e => {
          e.preventDefault();
          e.stopPropagation();
          form.handleSubmit();
        }}
      >
        <Stack $gap="1rem">
          {error && (
            <Alert $color="red">
              <AlertTitle>Error</AlertTitle>
              {error}
            </Alert>
          )}
          <form.Field name="password">
            {field => (
              <PasswordInput
                name="new-password"
                autoComplete="new-password"
                placeholder="New Password"
                value={field.state.value}
                errorMessage={fieldError(field.state.meta)}
                onBlur={field.handleBlur}
                onChange={e => field.handleChange(e.target.value)}
              />
            )}
          </form.Field>

          <form.Field name="confirmPassword">
            {field => (
              <PasswordInput
                name="confirm-password"
                autoComplete="new-password"
                placeholder="Confirm Password"
                value={field.state.value}
                errorMessage={fieldError(field.state.meta)}
                onBlur={field.handleBlur}
                onChange={e => field.handleChange(e.target.value)}
              />
            )}
          </form.Field>

          <AuthButtons>
            <Button type="submit" disabled={loading} isLoading={loading} loadingText="Resetting...">
              Reset Password
            </Button>
          </AuthButtons>
        </Stack>
      </form>
      <Group $justify="center" $gap="0.5rem">
        <Link to="/">Back to Login</Link>
      </Group>
    </AuthContainer>
  );
};

export default ResetPassword;
