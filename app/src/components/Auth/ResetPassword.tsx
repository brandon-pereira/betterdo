import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import AuthContainer from "./AuthContainer";
import { authClient } from "@utilities/auth";
import { Error as _Error, Input } from "@components/Forms";
import Link from "@components/Link";
import { AuthButtons, MainButton, OtherActionRibbon, SuccessMessage } from "./Auth.styles";

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [succeeded, setSucceeded] = useState(false);
  const [invalidToken, setInvalidToken] = useState(false);

  const token = searchParams.get("token");

  useEffect(() => {
    if (!token) {
      setInvalidToken(true);
    }
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Passwords don't match");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    setLoading(true);

    try {
      const { error } = await authClient.resetPassword({
        newPassword: password,
        token: token!
      });

      setLoading(false);

      if (error) {
        setError(error?.message ?? "An error occurred. The link may have expired.");
      } else {
        setSucceeded(true);
      }
    } catch (err: unknown) {
      setLoading(false);
      const errorMessage = err instanceof Error ? err.message : "An error occurred";
      setError(errorMessage);
    }
  };

  if (invalidToken) {
    return (
      <AuthContainer title="Invalid Link">
        <_Error>This password reset link is invalid or has expired.</_Error>
        <AuthButtons>
          <MainButton as={Link} to="/">
            Back to Login
          </MainButton>
        </AuthButtons>
      </AuthContainer>
    );
  }

  if (succeeded) {
    return (
      <AuthContainer title="Password Reset">
        <SuccessMessage>
          Your password has been reset successfully. You can now log in with your new password.
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
    <AuthContainer title="Reset Your Password">
      <form onSubmit={handleSubmit}>
        {error && <_Error>{error}</_Error>}
        <Input
          type="password"
          placeholder="New Password"
          value={password}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
          required
          minLength={8}
        />

        <Input
          type="password"
          placeholder="Confirm Password"
          value={confirmPassword}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setConfirmPassword(e.target.value)}
          required
          minLength={8}
        />

        <AuthButtons>
          <MainButton type="submit" disabled={loading}>
            {loading ? "Resetting..." : "Reset Password"}
          </MainButton>
        </AuthButtons>
      </form>
      <OtherActionRibbon>
        <Link to="/">Back to Login</Link>
      </OtherActionRibbon>
    </AuthContainer>
  );
};

export default ResetPassword;
