import React, { useState } from "react";
import AuthContainer from "./AuthContainer";
import { authClient } from "@utilities/auth";
import { Error as _Error, Input } from "@components/Forms";
import Link from "@components/Link";
import { AuthButtons, MainButton, OtherActionRibbon, SuccessMessage } from "./Auth.styles";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const { error } = await authClient.requestPasswordReset({
        email,
        redirectTo: `${window.location.origin}/auth/reset-password`
      });

      setLoading(false);

      if (error) {
        setError(error?.message ?? "An error occurred");
      } else {
        setSubmitted(true);
      }
    } catch (err: unknown) {
      setLoading(false);
      const errorMessage = err instanceof Error ? err.message : "An error occurred";
      setError(errorMessage);
    }
  };

  if (submitted) {
    return (
      <AuthContainer title="Check Your Email">
        <SuccessMessage>
          If an account with the email <strong>{email}</strong> exists, we'll send a password reset link. Please check
          your email (and spam folder) to reset your password.
        </SuccessMessage>
        <AuthButtons>
          <MainButton as={Link} to="/">
            Back to Login
          </MainButton>
        </AuthButtons>
      </AuthContainer>
    );
  }

  return (
    <AuthContainer title="Forgot Password">
      <form onSubmit={handleSubmit}>
        {error && <_Error>{error}</_Error>}
        <Input
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
          required
        />

        <AuthButtons>
          <MainButton type="submit" disabled={loading}>
            {loading ? "Sending..." : "Send Reset Link"}
          </MainButton>
        </AuthButtons>
      </form>
      <OtherActionRibbon>
        Remember your password? <Link to="/">Back to Login</Link>
      </OtherActionRibbon>
    </AuthContainer>
  );
};

export default ForgotPassword;
