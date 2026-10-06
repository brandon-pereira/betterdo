import { useReducer, useState } from "react";
import { useForm } from "@tanstack/react-form";
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
import { signUpSchema } from "@utilities/validation/auth";
import { fieldError, getErrorMessage } from "@utilities/forms";
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
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [onboarding, dispatch] = useReducer(onboardingReducer, { step: "sign-up" });

  const form = useForm({
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      confirmPassword: ""
    },
    validators: {
      onChange: signUpSchema
    },
    onSubmit: async ({ value }) => {
      setError("");
      setLoading(true);
      try {
        const localTimeZone = getTimeZone(Intl.DateTimeFormat().resolvedOptions().timeZone).name;
        const { error } = await signUp.email({
          email: value.email.trim(),
          password: value.password,
          name: `${value.firstName} ${value.lastName}`.trim(),
          timeZone: localTimeZone
        });
        if (error) {
          setError(getErrorMessage(error));
        } else {
          dispatch({ type: "emailSubmitted", email: value.email.trim() });
        }
      } catch (err: unknown) {
        setError(getErrorMessage(err));
      } finally {
        setLoading(false);
      }
    }
  });

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

          <form.Field name="firstName">
            {field => (
              <AuthInput
                type="text"
                name="given-name"
                autoComplete="given-name"
                placeholder="First Name"
                value={field.state.value}
                errorMessage={fieldError(field.state.meta)}
                onBlur={field.handleBlur}
                onChange={e => field.handleChange(e.target.value)}
              />
            )}
          </form.Field>

          <form.Field name="lastName">
            {field => (
              <AuthInput
                type="text"
                name="family-name"
                autoComplete="family-name"
                placeholder="Last Name"
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={e => field.handleChange(e.target.value)}
              />
            )}
          </form.Field>

          <form.Field name="email">
            {field => (
              <AuthInput
                type="email"
                name="email"
                autoComplete="username"
                placeholder="Email"
                value={field.state.value}
                errorMessage={fieldError(field.state.meta)}
                onBlur={field.handleBlur}
                onChange={e => field.handleChange(e.target.value)}
              />
            )}
          </form.Field>

          <form.Field name="password">
            {field => (
              <PasswordInput
                name="new-password"
                autoComplete="new-password"
                placeholder="Password"
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
