import AuthContainer from "./AuthContainer";
import { Alert, AlertTitle } from "./Auth.styles";
import Link from "@components/Link";

/** Shown when an OAuth authorization link (login or consent) is missing its signed query or has expired. */
const OAuthLinkExpired = () => (
  <AuthContainer title="Invalid Request">
    <Alert $color="red">
      <AlertTitle>Error</AlertTitle>
      This authorization link is invalid or has expired. Try connecting again from your app.
    </Alert>
    {/* Navigating to "/" drops the stale signed query. */}
    <Link to="/">Back to BetterDo</Link>
  </AuthContainer>
);

export default OAuthLinkExpired;
