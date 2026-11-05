import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import AuthContainer from "./AuthContainer";
import OAuthLinkExpired from "./OAuthLinkExpired";
import { authClient, isOAuthAuthorizationRequest, useSession } from "@utilities/auth";
import { getErrorMessage } from "@utilities/forms";
import { AuthProviders, Center, Stack, Alert, DimmedText, ScopeList } from "./Auth.styles";
import Button from "@components/Button";
import Loader from "@components/Loader";

// Human-readable descriptions for the scopes the API grants (see api/src/auth.ts).
const SCOPE_DESCRIPTIONS: Record<string, string> = {
  tasks: "View, create, and update your lists and tasks",
  offline_access: "Stay connected without asking you to sign in again"
};

const hostOf = (url: string | null) => {
  if (!url) return null;
  try {
    return new URL(url).host || url;
  } catch {
    return null;
  }
};

/**
 * OAuth consent screen shown when an MCP client (e.g. an AI assistant) asks to
 * access the user's account. The server redirects here with a signed query;
 * `oauthProviderClient` sends it back with the decision, and the response
 * redirects the browser to the client.
 */
const Consent = () => {
  const [searchParams] = useSearchParams();
  const { data: session } = useSession();
  const clientId = searchParams.get("client_id");
  const scopes = (searchParams.get("scope") ?? "").split(" ").filter(Boolean);
  const redirectHost = hostOf(searchParams.get("redirect_uri"));
  const isSigned = isOAuthAuthorizationRequest(searchParams);

  const [clientName, setClientName] = useState<string | null>(null);
  const [loadingClient, setLoadingClient] = useState(Boolean(clientId && isSigned));
  const [submitting, setSubmitting] = useState<"allow" | "deny" | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!clientId || !isSigned) return;
    let cancelled = false;
    authClient.oauth2.publicClient({ query: { client_id: clientId } }).then(({ data, error }) => {
      if (cancelled) return;
      if (error) setError(getErrorMessage(error, "Unable to load the app requesting access."));
      setClientName(data?.client_name ?? null);
      setLoadingClient(false);
    });
    return () => {
      cancelled = true;
    };
  }, [clientId, isSigned]);

  const respond = async (accept: boolean) => {
    setError(null);
    setSubmitting(accept ? "allow" : "deny");
    // On success the response is a redirect back to the client, which the auth
    // client follows automatically, so we stay in the submitting state.
    const { error } = await authClient.oauth2.consent({ accept });
    if (error) {
      setSubmitting(null);
      setError(getErrorMessage(error, "Something went wrong. Please try connecting again from your app."));
    }
  };

  if (!clientId || !isSigned) {
    return <OAuthLinkExpired />;
  }

  if (loadingClient) {
    return (
      <AuthContainer title="Connect an App">
        <Center>
          <Loader isVisible color="currentColor" size="2.5rem" />
        </Center>
      </AuthContainer>
    );
  }

  const appName = clientName || "An app";

  return (
    <AuthContainer title="Connect an App">
      <Stack $gap="1rem">
        {error && <Alert $color="red">{error}</Alert>}
        <DimmedText>
          <strong>{appName}</strong> wants to access your BetterDo account
          {session?.user.email ? ` (${session.user.email})` : ""}. It will be able to:
        </DimmedText>
        <ScopeList>
          {scopes.map(scope => (
            <li key={scope}>{SCOPE_DESCRIPTIONS[scope] ?? scope}</li>
          ))}
        </ScopeList>
        <DimmedText>
          {redirectHost && (
            <>
              You&apos;ll be returned to <strong>{redirectHost}</strong>.{" "}
            </>
          )}
          Only allow apps you trust. App names are provided by the app itself.
        </DimmedText>
        <AuthProviders>
          <Button
            variant="secondary"
            onClick={() => respond(false)}
            disabled={submitting !== null}
            isLoading={submitting === "deny"}
            loadingText="Denying"
            fullWidth
          >
            Deny
          </Button>
          <Button
            onClick={() => respond(true)}
            disabled={submitting !== null}
            isLoading={submitting === "allow"}
            loadingText="Allowing"
            fullWidth
          >
            Allow
          </Button>
        </AuthProviders>
      </Stack>
    </AuthContainer>
  );
};

export default Consent;
