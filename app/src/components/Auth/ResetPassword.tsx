import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { PasswordInput, Button, Alert, Stack, Group } from "@mantine/core";
import AuthContainer from "./AuthContainer";
import { authClient } from "@utilities/auth";
import { AuthButtons } from "./Auth.styles";
import Link from "@components/Link";

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [succeeded, setSucceeded] = useState(false);
  const [invalidToken, setInvalidToken] = useState(false);

  const token = searchParams.get("token");

  useEffect(() => {
    if (!token) {
      setInvalidToken(true);
    }
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Passwords don't match");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    setLoading(true);

    try {
      const { error } = await authClient.resetPassword({
        newPassword: password,
        token: token!
      });

      setLoading(false);

      if (error) {
        setError(error?.message ?? "An error occurred. The link may have expired.");
      } else {
        setSucceeded(true);
      }
    } catch (err: unknown) {
      setLoading(false);
      const errorMessage = err instanceof Error ? err.message : "An error occurred";
      setError(errorMessage);
    }
  };

  if (invalidToken) {
    return (
      <AuthContainer title="Invalid Link">
        <Alert color="red" title="Error">
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
        <Alert color="green" title="Success">
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
      <form onSubmit={handleSubmit}>
        <Stack gap="md">
          {error && (
            <Alert color="red" title="Error">
              {error}
            </Alert>
          )}
          <PasswordInput
            placeholder="New Password"
            value={password}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
            required
            minLength={8}
          />

          <PasswordInput
            placeholder="Confirm Password"
            value={confirmPassword}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setConfirmPassword(e.target.value)}
            required
            minLength={8}
          />

          <AuthButtons>
            <Button type="submit" disabled={loading} loading={loading}>
              {loading ? "Resetting..." : "Reset Password"}
            </Button>
          </AuthButtons>
        </Stack>
      </form>
      <Group justify="center" gap="xs" mt="sm">
        <Link to="/">Back to Login</Link>
      </Group>
    </AuthContainer>
  );
};

export default ResetPassword;
