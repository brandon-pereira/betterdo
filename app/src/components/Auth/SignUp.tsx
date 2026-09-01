import React, { useReducer, useState } from "react";
import { TextInput, Divider, PasswordInput, Button, Alert, Stack, Group, Text } from "@mantine/core";
import AuthContainer from "./AuthContainer";
import { AuthButtons, AuthProviders } from "./Auth.styles";
import { authClient, signIn, signUp } from "@utilities/auth";
import { getTimeZone } from "@utilities/timezones";
import Link from "@components/Link";

// The signup flow is a small step machine: fill out the form, then (once an
// account exists and a verification email has been sent) show the "check your
// inbox" screen. The verified email is carried in the "verify-email" state.
type OnboardingState = { step: "sign-up" } | { step: "verify-email"; email: string };

type OnboardingAction = { type: "emailSubmitted"; email: string };

const onboardingReducer = (_state: OnboardingState, action: OnboardingAction): OnboardingState => {
  switch (action.type) {
    case "emailSubmitted":
      return { step: "verify-email", email: action.email };
  }
};

const SignUp = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [onboarding, dispatch] = useReducer(onboardingReducer, { step: "sign-up" });

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
      const localTimeZone = getTimeZone(Intl.DateTimeFormat().resolvedOptions().timeZone).name;
      const { error } = await signUp.email({
        email,
        password,
        name: `${firstName} ${lastName}`.trim(),
        timeZone: localTimeZone
      });
      if (error) {
        setError(error.message ?? "An error occurred");
      } else {
        dispatch({ type: "emailSubmitted", email });
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "An error occurred";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (onboarding.step !== "verify-email") return;
    setError("");
    setLoading(true);
    try {
      await authClient.sendVerificationEmail({ email: onboarding.email });
    } catch {
      // Non-fatal; the user can try again.
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError("");
    setLoading(true);
    const { error } = await signIn.social({
      provider: "google",
      callbackURL: `${window.location.origin}${import.meta.env.BASE_URL}`,
      errorCallbackURL: `${window.location.origin}${import.meta.env.BASE_URL}auth/signup`
    });
    setLoading(false);
    if (error) {
      setError(error.message ?? "An error occurred");
    }
  };

  if (onboarding.step === "verify-email") {
    return (
      <AuthContainer title="Check your inbox">
        <Stack gap="md">
          <Alert color="green" title="Account created">
            We&apos;ve sent a verification link to <strong>{onboarding.email}</strong>. Click it to verify your email
            and finish signing in.
          </Alert>
          <Text size="sm" c="dimmed" ta="center">
            Didn&apos;t get it? Check your spam folder, or resend the email below.
          </Text>
          <AuthButtons>
            <Button variant="default" onClick={handleResend} disabled={loading} loading={loading} fullWidth>
              Resend verification email
            </Button>
          </AuthButtons>
        </Stack>
        <Group justify="center" gap="xs" mt="sm">
          <Link to="/">Back to Login</Link>
        </Group>
      </AuthContainer>
    );
  }

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
        <Link to="/">Sign in</Link>
      </Group>
    </AuthContainer>
  );
};

export default SignUp;
