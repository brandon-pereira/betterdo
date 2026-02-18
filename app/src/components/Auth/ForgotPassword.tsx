import React, { useState } from "react";
import { TextInput, Button, Alert, Stack, Group, Text } from "@mantine/core";
import AuthContainer from "./AuthContainer";
import { authClient } from "@utilities/auth";
import { AuthButtons } from "./Auth.styles";
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
        redirectTo: `${window.location.origin}/auth/reset-password`
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
        <Alert>
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
        <Stack gap="md">
          {error && (
            <Alert color="red" title="Error">
              {error}
            </Alert>
          )}
          <TextInput
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
            required
          />

          <AuthButtons>
            <Button type="submit" disabled={loading} loading={loading}>
              {loading ? "Sending..." : "Send Reset Link"}
            </Button>
          </AuthButtons>
        </Stack>
      </form>
      <Group justify="center" gap="xs" mt="sm">
        <Text size="sm" c="dimmed">
          Remember your password?
        </Text>
        <Link to="/">Back to Login</Link>
      </Group>
    </AuthContainer>
  );
};

export default ForgotPassword;
