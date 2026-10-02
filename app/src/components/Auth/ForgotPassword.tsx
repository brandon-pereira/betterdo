import React, { useState } from "react";
import AuthContainer from "./AuthContainer";
import { authClient } from "@utilities/auth";
import { AuthButtons, AuthInput, Stack, Group, Alert, AlertTitle, DimmedText } from "./Auth.styles";
import Button from "@components/Button";
import Link from "@components/Link";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const { error } = await authClient.requestPasswordReset({
        email,
        redirectTo: `${window.location.origin}${import.meta.env.BASE_URL}auth/reset-password`
      });

      setLoading(false);

      if (error) {
        setError(error?.message ?? "An error occurred");
      } else {
        setSubmitted(true);
      }
    } catch (err: unknown) {
      setLoading(false);
      const errorMessage = err instanceof Error ? err.message : "An error occurred";
      setError(errorMessage);
    }
  };

  if (submitted) {
    return (
      <AuthContainer title="Check Your Email">
        <Alert $color="blue">
          If an account with the email <strong>{email}</strong> exists, we'll send a password reset link.
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
      <form onSubmit={handleSubmit}>
        <Stack $gap="1rem">
          {error && (
            <Alert $color="red">
              <AlertTitle>Error</AlertTitle>
              {error}
            </Alert>
          )}
          <AuthInput
            type="email"
            name="email"
            autoComplete="username"
            placeholder="Enter your email"
            value={email}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
            required
          />

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
