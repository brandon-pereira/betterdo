import { useState } from "react";
import { useForm } from "@tanstack/react-form";
import AuthContainer from "./AuthContainer";
import { authClient } from "@utilities/auth";
import { AuthButtons, AuthInput, Stack, Group, Alert, AlertTitle, DimmedText } from "./Auth.styles";
import Button from "@components/Button";
import Link from "@components/Link";
import { forgotPasswordSchema } from "@utilities/validation/auth";
import { fieldError, getErrorMessage } from "@utilities/forms";

const ForgotPassword = () => {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState("");

  const form = useForm({
    defaultValues: { email: "" },
    validators: { onChange: forgotPasswordSchema },
    onSubmit: async ({ value }) => {
      const email = value.email.trim();
      setError(null);
      setLoading(true);
      try {
        const { error } = await authClient.requestPasswordReset({
          email,
          redirectTo: `${window.location.origin}${import.meta.env.BASE_URL}auth/reset-password`
        });
        setLoading(false);
        if (error) {
          setError(getErrorMessage(error));
        } else {
          setSubmittedEmail(email);
          setSubmitted(true);
        }
      } catch (err: unknown) {
        setLoading(false);
        setError(getErrorMessage(err));
      }
    }
  });

  if (submitted) {
    return (
      <AuthContainer title="Check Your Email">
        <Alert $color="blue">
          If an account with the email <strong>{submittedEmail}</strong> exists, we'll send a password reset link.
          <br />
          <br />
          Please check your email (and spam folder) to reset your password.
        </Alert>
        <AuthButtons>
          <Link to="/">Back to Login</Link>
        </AuthButtons>
      </AuthContainer>
    );
  }

  return (
    <AuthContainer title="Forgot Password">
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
          <form.Field name="email">
            {field => (
              <AuthInput
                type="email"
                name="email"
                autoComplete="username"
                placeholder="Enter your email"
                value={field.state.value}
                errorMessage={fieldError(field.state.meta)}
                onBlur={field.handleBlur}
                onChange={e => field.handleChange(e.target.value)}
              />
            )}
          </form.Field>

          <AuthButtons>
            <Button type="submit" disabled={loading} isLoading={loading} loadingText="Sending...">
              Send Reset Link
            </Button>
          </AuthButtons>
        </Stack>
      </form>
      <Group $justify="center" $gap="0.5rem">
        <DimmedText>Remember your password?</DimmedText>
        <Link to="/">Back to Login</Link>
      </Group>
    </AuthContainer>
  );
};

export default ForgotPassword;
