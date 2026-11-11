import Profile from "./Profile";
import Passkeys from "./Passkeys";
import Password from "./Password";
import {
  Card,
  LoadingText,
  Page,
  Row,
  RowActions,
  RowDescription,
  RowText,
  RowTitle,
  Section,
  SectionHeader,
  SectionTitle,
  TinyButton
} from "../Settings.styles";

import useProfile from "@hooks/useProfile";

function Account() {
  const { logout, loading } = useProfile();

  if (loading) {
    return <LoadingText>Loading…</LoadingText>;
  }
  return (
    <Page>
      <Profile />
      <Section>
        <SectionHeader>
          <SectionTitle>Sign-in &amp; security</SectionTitle>
        </SectionHeader>
        <Card>
          <Passkeys />
          <Password />
        </Card>
      </Section>
      <Section>
        <Card>
          <Row>
            <RowText>
              <RowTitle>Sign out</RowTitle>
              <RowDescription>End your session on this device and return to the login screen.</RowDescription>
            </RowText>
            <RowActions>
              <TinyButton onClick={logout} color="red">
                Sign out
              </TinyButton>
            </RowActions>
          </Row>
        </Card>
      </Section>
    </Page>
  );
}

export default Account;
