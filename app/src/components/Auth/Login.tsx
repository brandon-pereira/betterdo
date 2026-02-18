import React, { useEffect, useState } from "react";
import { TextInput, PasswordInput, Divider, Button, Alert, Stack, Group, Text, VisuallyHidden } from "@mantine/core";
import AuthContainer from "./AuthContainer";
import { authClient, signIn } from "@utilities/auth";
import { AuthProviders, AuthButtons } from "./Auth.styles";
import Link from "@components/Link";

const Auth = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { error } = await signIn.email({
      email,
      password
    });
    setLoading(false);
    if (error) {
      setError(error.message ?? "An error occurred");
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

  const handlePasskeySignIn = async () => {
    setError("");
    setLoading(true);
    const res = await signIn.passkey();
    setLoading(false);
    if (res?.error) {
      setError(res.error.message ?? "An error occurred");
      return;
    }
    // https://github.com/better-auth/better-auth/issues/858
    authClient.$store.notify("$sessionSignal");
  };

  useEffect(() => {
    if (
      !PublicKeyCredential.isConditionalMediationAvailable ||
      !PublicKeyCredential.isConditionalMediationAvailable()
    ) {
      return;
    }

    authClient.signIn.passkey({ autoFill: true }).then(res => {
      if (res?.error) {
        if ("code" in res.error && res.error.code === "AUTH_CANCELLED") {
          return;
        }
        setError(res.error.message ?? "An error occurred during passkey sign-in");
      }
    });
  }, []);

  return (
    <AuthContainer title="Welcome Back!">
      <form onSubmit={handleSubmit}>
        <Stack gap="md">
          {error && <Alert color="red">{error}</Alert>}
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

          <AuthButtons>
            <Link to="/auth/forgot-password">Forgot Password?</Link>
            <Button type="submit" disabled={loading} loading={loading}>
              {loading ? "Logging In..." : "Log In"}
            </Button>
          </AuthButtons>
        </Stack>
      </form>
      <Divider label="Or Login With" />
      <AuthProviders>
        <Button variant="default" onClick={handleGoogleSignIn} disabled={loading} fullWidth>
          Google
        </Button>
        <Button variant="default" onClick={handlePasskeySignIn} disabled={loading} fullWidth>
          Passkey
        </Button>
        <VisuallyHidden>
          <label htmlFor="name">Username:</label>
          <input type="text" name="name" autoComplete="username webauthn" />
          <label htmlFor="password">Password:</label>
          <input type="password" name="password" autoComplete="current-password webauthn" />
        </VisuallyHidden>
      </AuthProviders>
      <Group justify="center" gap="xs" mt="sm">
        <Text size="sm" c="dimmed">
          Don't have an account?
        </Text>
        <Link to="/auth/signup">Register Here</Link>
      </Group>
    </AuthContainer>
  );
};

export default Auth;
