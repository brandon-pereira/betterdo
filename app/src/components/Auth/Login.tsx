import { useEffect, useState } from "react";
import { useForm } from "@tanstack/react-form";
import AuthContainer from "./AuthContainer";
import PasswordInput from "./PasswordInput";
import { authClient, signIn } from "@utilities/auth";
import {
  AuthProviders,
  AuthButtons,
  AuthInput,
  Stack,
  Group,
  Alert,
  Divider,
  DimmedText,
  VisuallyHidden
} from "./Auth.styles";
import Button from "@components/Button";
import Link from "@components/Link";
import { loginSchema } from "@utilities/validation/auth";
import { fieldError, getErrorMessage } from "@utilities/forms";

const Auth = () => {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const form = useForm({
    defaultValues: { email: "", password: "" },
    validators: { onChange: loginSchema },
    onSubmit: async ({ value }) => {
      setError(null);
      setLoading(true);
      const { error } = await signIn.email({
        email: value.email.trim(),
        password: value.password
      });
      if (error) {
        setLoading(false);
        setError(getErrorMessage(error));
      }
    }
  });

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
      setError(getErrorMessage(error));
    }
  };

  const handlePasskeySignIn = async () => {
    setError("");
    setLoading(true);
    const res = await signIn.passkey();
    if (res?.error) {
      setLoading(false);
      setError(getErrorMessage(res.error));
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
      typeof PublicKeyCredential === "undefined" ||
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
      <form
        onSubmit={e => {
          e.preventDefault();
          e.stopPropagation();
          form.handleSubmit();
        }}
      >
        <Stack $gap="1rem">
          {error && <Alert $color="red">{error}</Alert>}
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
                name="password"
                autoComplete="current-password"
                placeholder="Password"
                value={field.state.value}
                errorMessage={fieldError(field.state.meta)}
                onBlur={field.handleBlur}
                onChange={e => field.handleChange(e.target.value)}
              />
            )}
          </form.Field>

          <AuthButtons>
            <Link to="/auth/forgot-password">Forgot Password?</Link>
            <Button type="submit" disabled={loading} isLoading={loading} loadingText="Logging In...">
              Log In
            </Button>
          </AuthButtons>
        </Stack>
      </form>
      <Divider>Or Login With</Divider>
      <AuthProviders>
        <Button variant="secondary" onClick={handleGoogleSignIn} disabled={loading} fullWidth>
          Google
        </Button>
        <Button variant="secondary" onClick={handlePasskeySignIn} disabled={loading} fullWidth>
          Passkey
        </Button>
        <VisuallyHidden>
          <label htmlFor="name">Username:</label>
          <input type="text" name="name" autoComplete="username webauthn" />
          <label htmlFor="password">Password:</label>
          <input type="password" name="password" autoComplete="current-password webauthn" />
        </VisuallyHidden>
      </AuthProviders>
      <Group $justify="center" $gap="0.5rem">
        <DimmedText>Don't have an account?</DimmedText>
        <Link to="/auth/signup">Register Here</Link>
      </Group>
    </AuthContainer>
  );
};

export default Auth;
