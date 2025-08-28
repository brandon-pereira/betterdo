import React, { useState } from "react";
import AuthContainer from "./AuthContainer";
import { authClient, signIn } from "@utilities/auth";
import { Error, Input } from "@components/Forms";
import Button from "@components/Button";
import Link from "@components/Link";
import { AuthProviders, AuthButtons, MainButton, OtherActionRibbon } from "./Auth.styles";
import Divider from "@components/Divider/Divider";

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

  return (
    <AuthContainer title="Welcome Back!">
      <form onSubmit={handleSubmit}>
        {error && <Error>{error}</Error>}
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

        <AuthButtons>
          <Link to="/auth/forgot-password">Forgot Password?</Link>
          <MainButton type="submit" disabled={loading}>
            {loading ? "Logging In..." : "Log In"}
          </MainButton>
        </AuthButtons>
      </form>
      <Divider text="Or Login With" textColor="#ccc" />
      <AuthProviders>
        <Button variant="secondary" color="#eee" onClick={handleGoogleSignIn} disabled={loading}>
          Google
        </Button>
        <Button variant="secondary" color="#eee" onClick={handlePasskeySignIn} disabled={loading}>
          Passkey
        </Button>
      </AuthProviders>
      <OtherActionRibbon>
        Don't have an account? <Link to="/auth/signup">Register Here</Link>
      </OtherActionRibbon>
    </AuthContainer>
  );
};

export default Auth;
