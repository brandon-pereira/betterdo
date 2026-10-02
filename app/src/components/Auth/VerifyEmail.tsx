import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import AuthContainer from "./AuthContainer";
import { authClient } from "@utilities/auth";
import { AuthButtons, Center, Stack, Alert, AlertTitle, DimmedText } from "./Auth.styles";
import Loader from "@components/Loader";
import Link from "@components/Link";

type Status = "verifying" | "success" | "error" | "invalid";

const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const [status, setStatus] = useState<Status>(token ? "verifying" : "invalid");
  const [error, setError] = useState<string | null>(null);
  const hasVerified = useRef(false);

  useEffect(() => {
    if (!token || hasVerified.current) return;
    hasVerified.current = true;

    let cancelled = false;

    (async () => {
      try {
        const { error } = await authClient.verifyEmail({ query: { token } });

        if (cancelled) return;

        if (error) {
          setError(error.message ?? "This verification link is invalid or has expired.");
          setStatus("error");
          return;
        }

        setStatus("success");

        // autoSignInAfterVerification set the session cookie; refresh the client
        // session so App.tsx's useSession picks it up and swaps into the app.
        await authClient.getSession();
      } catch (err: unknown) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "An error occurred while verifying your email.");
        setStatus("error");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [token]);

  if (status === "invalid") {
    return (
      <AuthContainer title="Invalid Link">
        <Alert $color="red">
          <AlertTitle>Error</AlertTitle>
          This verification link is invalid or has expired.
        </Alert>
        <AuthButtons>
          <Link to="/">Back to Login</Link>
        </AuthButtons>
      </AuthContainer>
    );
  }

  if (status === "error") {
    return (
      <AuthContainer title="Verification Failed">
        <Alert $color="red">
          <AlertTitle>Error</AlertTitle>
          {error}
        </Alert>
        <AuthButtons>
          <Link to="/">Back to Login</Link>
        </AuthButtons>
      </AuthContainer>
    );
  }

  if (status === "success") {
    return (
      <AuthContainer title="Email Verified">
        <Center>
          <Stack $align="center" $gap="0.75rem">
            <Loader isVisible color="currentColor" size="2.5rem" />
            <DimmedText>Email verified. Signing you in...</DimmedText>
          </Stack>
        </Center>
      </AuthContainer>
    );
  }

  return (
    <AuthContainer title="Verifying Your Email">
      <Center>
        <Stack $align="center" $gap="0.75rem">
          <Loader isVisible color="currentColor" size="2.5rem" />
          <DimmedText>Please wait while we verify your email address...</DimmedText>
        </Stack>
      </Center>
    </AuthContainer>
  );
};

export default VerifyEmail;
