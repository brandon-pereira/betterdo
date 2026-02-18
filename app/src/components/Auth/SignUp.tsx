import React, { useState } from "react";
import { TextInput, Divider, PasswordInput, Button, Alert, Stack, Group, Text } from "@mantine/core";
import AuthContainer from "./AuthContainer";
import { MainButton, AuthButtons, AuthProviders } from "./Auth.styles";
import { signIn, signUp } from "@utilities/auth";
import Link from "@components/Link";

const SignUp = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (password !== confirmPassword) {
        setError("Passwords don't match");
        setLoading(false);
        return;
      }
      const { error } = await signUp.email({
        email,
        password,
        name: `${firstName} ${lastName}`.trim()
      });
      if (error) {
        setError(error.message ?? "An error occurred");
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "An error occurred";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError("");
    setLoading(true);
    const { error } = await signIn.social({
      provider: "google"
    });
    setLoading(false);
    if (error) {
      setError(error.message ?? "An error occurred");
    }
  };

  return (
    <AuthContainer title="Create your account">
      <form onSubmit={handleSubmit}>
        <Stack gap="md">
          {error && (
            <Alert color="red" title="Error">
              {error}
            </Alert>
          )}

          <TextInput
            type="text"
            placeholder="First Name"
            value={firstName}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFirstName(e.target.value)}
            required
          />
          <TextInput
            type="text"
            placeholder="Last Name"
            value={lastName}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setLastName(e.target.value)}
            required
          />

          <TextInput
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
            required
          />

          <PasswordInput
            placeholder="Password"
            value={password}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
            required
          />

          <PasswordInput
            placeholder="Confirm Password"
            value={confirmPassword}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setConfirmPassword(e.target.value)}
            required
          />

          <AuthButtons>
            <Button type="submit" disabled={loading} loading={loading}>
              {loading ? "Please wait..." : "Create Account"}
            </Button>
          </AuthButtons>
        </Stack>
      </form>

      <Divider label="Or Create With" />
      <AuthProviders>
        <Button variant="default" onClick={handleGoogleSignIn} disabled={loading} fullWidth>
          Google
        </Button>
      </AuthProviders>

      <Group justify="center" gap="xs" mt="sm">
        <Text size="sm" c="dimmed">
          Already have an account?
        </Text>
        <Link to="/auth/login">Sign in</Link>
      </Group>
    </AuthContainer>
  );
};

export default SignUp;
