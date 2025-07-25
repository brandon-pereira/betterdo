import React, { useState } from "react";
import AuthContainer from "./AuthContainer";
import { ErrorMessage } from "./Auth.styles";
import { authClient, signIn, signUp, useSession } from "@utilities/auth";
import { Input } from "@components/Forms";
import Button from "@components/Button";

type AuthMode = "signin" | "signup";

const Auth = () => {
  const [mode, setMode] = useState<AuthMode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { data: session } = useSession();

  // If user is already signed in, don't show auth form
  if (session) {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (mode === "signup") {
        if (password !== confirmPassword) {
          setError("Passwords don't match");
          setLoading(false);
          return;
        }
        await signUp.email({
          email,
          password,
          name: `${firstName} ${lastName}`.trim()
        });
      } else {
        await signIn.email({
          email,
          password
        });
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
    try {
      await signIn.social({
        provider: "google"
      });
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "An error occurred";
      setError(errorMessage);
      setLoading(false);
    }
  };

  const handlePasskeySignIn = async () => {
    setError("");
    setLoading(true);
    try {
      await signIn.passkey();
      // https://github.com/better-auth/better-auth/issues/858
      authClient.$store.notify("$sessionSignal");
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An error occurred";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setMode(mode === "signin" ? "signup" : "signin");
    setError("");
  };

  return (
    <AuthContainer title={mode === "signin" ? "Welcome back" : "Create your account"}>
      {error && <ErrorMessage>{error}</ErrorMessage>}

      <form onSubmit={handleSubmit}>
        {mode === "signup" && (
          <>
            <Input
              type="text"
              placeholder="First Name"
              value={firstName}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFirstName(e.target.value)}
              required
            />
            <Input
              type="text"
              placeholder="Last Name"
              value={lastName}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setLastName(e.target.value)}
              required
            />
          </>
        )}

        <Input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
          required
        />

        <Input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
          required
        />

        {mode === "signup" && (
          <Input
            type="password"
            placeholder="Confirm Password"
            value={confirmPassword}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setConfirmPassword(e.target.value)}
            required
          />
        )}

        <Button type="submit" disabled={loading}>
          {loading ? "Please wait..." : mode === "signin" ? "Sign In" : "Create Account"}
        </Button>
      </form>

      <Button onClick={handleGoogleSignIn} disabled={loading}>
        Continue with Google
      </Button>

      <Button onClick={handlePasskeySignIn} disabled={loading}>
        Sign in with Passkey
      </Button>

      <Button onClick={toggleMode} disabled={loading}>
        {mode === "signin" ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
      </Button>
    </AuthContainer>
  );
};

export default Auth;
