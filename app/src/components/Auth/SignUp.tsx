import React, { useState } from "react";
import AuthContainer from "./AuthContainer";
import { ErrorMessage, MainButton, AuthButtons, AuthProviders, OtherActionRibbon } from "./Auth.styles";
import { signIn, signUp } from "@utilities/auth";
import { Input } from "@components/Forms";
import Button from "@components/Button";
import Divider from "@components/Divider/Divider";
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
      {error && <ErrorMessage>{error}</ErrorMessage>}

      <form onSubmit={handleSubmit}>
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

        <Input
          type="password"
          placeholder="Confirm Password"
          value={confirmPassword}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setConfirmPassword(e.target.value)}
          required
        />

        <AuthButtons>
          <MainButton type="submit" disabled={loading}>
            {loading ? "Please wait..." : "Create Account"}
          </MainButton>
        </AuthButtons>
      </form>

      <Divider text="Or Create With" textColor="#ccc" />
      <AuthProviders>
        <Button variant="secondary" color="#eee" onClick={handleGoogleSignIn} disabled={loading}>
          Google
        </Button>
      </AuthProviders>

      <OtherActionRibbon>
        Already have an account? <Link to="/auth/login">Sign in</Link>
      </OtherActionRibbon>
    </AuthContainer>
  );
};

export default SignUp;
