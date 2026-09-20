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
    if (error) {
      setLoading(false);
      setError(error.message ?? "An error occurred");
      return;
    }
  };

  const handleGoogleSignIn = async () => {
    setError("");
    setLoading(true);
    const { error } = await signIn.social({
      provider: "google",
      callbackURL: `${window.location.origin}${import.meta.env.BASE_URL}`,
      errorCallbackURL: `${window.location.origin}${import.meta.env.BASE_URL}`
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
    if (res?.error) {
      setLoading(false);
      setError(res.error.message ?? "An error occurred");
      return;
    }
    // signIn.passkey() already flips "$sessionSignal" internally, which triggers
    // a background /get-session refetch that swaps the app into CoreApp. Await an
    // explicit getSession() as well so we know the session cookie has landed
    // before we drop the loading state — this avoids a flash back to the idle
    // login form while the reactive refetch is still in flight.
    await authClient.getSession();
    // Keep `loading` true: the app is about to re-render into CoreApp, so there's
    // no need to reset it (resetting can briefly flash the idle form).
  };

  useEffect(() => {
    if (
      !PublicKeyCredential.isConditionalMediationAvailable ||
      !PublicKeyCredential.isConditionalMediationAvailable()
    ) {
      return;
    }

    // Passkey autofill (conditional UI) runs passively in the background; the
    // user hasn't attempted to sign in. Never surface its errors as a
    // user-facing sign-in failure — just log them for debugging.
    authClient.signIn.passkey({ autoFill: true }).then(res => {
      if (res?.error) {
        console.debug("Passkey autofill unavailable:", res.error);
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
            name="email"
            autoComplete="username"
            placeholder="Email"
            value={email}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
            required
          />

          <PasswordInput
            name="password"
            autoComplete="current-password"
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
