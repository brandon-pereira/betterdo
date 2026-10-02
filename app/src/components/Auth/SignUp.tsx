import React, { useReducer, useState } from "react";
import AuthContainer from "./AuthContainer";
import PasswordInput from "./PasswordInput";
import {
  AuthButtons,
  AuthProviders,
  AuthInput,
  Stack,
  Group,
  Alert,
  AlertTitle,
  Divider,
  DimmedText
} from "./Auth.styles";
import Button from "@components/Button";
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
        <Stack $gap="1rem">
          <Alert $color="green">
            <AlertTitle>Account created</AlertTitle>
            We&apos;ve sent a verification link to <strong>{onboarding.email}</strong>. Click it to verify your email
            and finish signing in.
          </Alert>
          <DimmedText $align="center">
            Didn&apos;t get it? Check your spam folder, or resend the email below.
          </DimmedText>
          <AuthButtons>
            <Button
              variant="secondary"
              onClick={handleResend}
              disabled={loading}
              isLoading={loading}
              loadingText="Please wait..."
              fullWidth
            >
              Resend verification email
            </Button>
          </AuthButtons>
        </Stack>
        <Group $justify="center" $gap="0.5rem">
          <Link to="/">Back to Login</Link>
        </Group>
      </AuthContainer>
    );
  }

  return (
    <AuthContainer title="Create your account">
      <form onSubmit={handleSubmit}>
        <Stack $gap="1rem">
          {error && (
            <Alert $color="red">
              <AlertTitle>Error</AlertTitle>
              {error}
            </Alert>
          )}

          <AuthInput
            type="text"
            name="given-name"
            autoComplete="given-name"
            placeholder="First Name"
            value={firstName}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFirstName(e.target.value)}
            required
          />
          <AuthInput
            type="text"
            name="family-name"
            autoComplete="family-name"
            placeholder="Last Name"
            value={lastName}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setLastName(e.target.value)}
            required
          />

          <AuthInput
            type="email"
            name="email"
            autoComplete="username"
            placeholder="Email"
            value={email}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
            required
          />

          <PasswordInput
            name="new-password"
            autoComplete="new-password"
            placeholder="Password"
            value={password}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
            required
          />

          <PasswordInput
            name="confirm-password"
            autoComplete="new-password"
            placeholder="Confirm Password"
            value={confirmPassword}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setConfirmPassword(e.target.value)}
            required
          />

          <AuthButtons>
            <Button type="submit" disabled={loading} isLoading={loading} loadingText="Please wait...">
              Create Account
            </Button>
          </AuthButtons>
        </Stack>
      </form>

      <Divider>Or Create With</Divider>
      <AuthProviders>
        <Button variant="secondary" onClick={handleGoogleSignIn} disabled={loading} fullWidth>
          Google
        </Button>
      </AuthProviders>

      <Group $justify="center" $gap="0.5rem">
        <DimmedText>Already have an account?</DimmedText>
        <Link to="/">Sign in</Link>
      </Group>
    </AuthContainer>
  );
};

export default SignUp;
