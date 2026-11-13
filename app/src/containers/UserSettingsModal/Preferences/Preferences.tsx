import { useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  Alert,
  Card,
  LoadingText,
  Page,
  Row,
  RowDescription,
  RowText,
  RowTitle,
  Section,
  SectionDescription,
  SectionHeader,
  SectionTitle,
  TinyButton
} from "../Settings.styles";
import { ListIcon } from "./Preferences.styles";

import { timeZones } from "@utilities/timezones";
import CUSTOM_LISTS from "@utilities/customLists";
import Toggle from "@components/Toggle";
import Dropdown from "@components/Dropdown";
import useProfile from "@hooks/useProfile";
import useModifyProfile from "@hooks/useModifyProfile";
import useDarkMode from "@hooks/useDarkMode";
import { ServerError } from "@utilities/server";
import type { UpdateUserObject } from "@customTypes/user";

function Preferences() {
  const { profile, loading } = useProfile();
  const modifyProfile = useModifyProfile();
  const navigate = useNavigate();
  const [darkMode, doesPreferDarkMode] = useDarkMode();
  const [state, setState] = useState({
    isBeta: profile?.isBeta || false,
    isPushEnabled: profile?.isPushEnabled || false,
    timeZone: profile?.timeZone || ""
  });
  const [error, setError] = useState<string | null>(null);
  // The better-auth session (via useProfile) is the single source of truth for
  // custom lists. We send only the toggled key; the server merges it into
  // existing values, so overlapping toggles can't clobber each other.
  const customLists = profile?.customLists ?? {};

  const save = useCallback(
    async (payload: UpdateUserObject) => {
      setError(null);
      try {
        await modifyProfile(payload);
      } catch (err) {
        setError(err instanceof ServerError ? err.formattedMessage : ServerError.defaultError);
      }
    },
    [modifyProfile]
  );

  const onChange = useCallback(
    (newState: Partial<typeof state>) => {
      setState(state => ({ ...state, ...newState }));
      save(newState);
    },
    [save]
  );

  if (loading) {
    return <LoadingText>Loading…</LoadingText>;
  }
  return (
    <Page>
      {error && <Alert data-variant="error">{error}</Alert>}
      <Section>
        <SectionHeader>
          <SectionTitle>General</SectionTitle>
        </SectionHeader>
        <Card>
          <Row>
            <RowText>
              <RowTitle>Notifications</RowTitle>
              <RowDescription>Get notified when a task is due or a friend updates a shared list.</RowDescription>
            </RowText>
            <Toggle onChange={(e, bool) => onChange({ isPushEnabled: bool })} value={state.isPushEnabled} />
          </Row>
          <Row>
            <RowText>
              <RowTitle>Automatic dark mode</RowTitle>
              <RowDescription>
                Follow your system appearance. Turn off to always use light mode on this device.
              </RowDescription>
            </RowText>
            <Toggle onChange={(e, bool) => doesPreferDarkMode(bool)} value={darkMode} />
          </Row>
          <Row data-stack="true">
            <RowText>
              <RowTitle>Timezone</RowTitle>
              <RowDescription>Used to work out when tasks are due.</RowDescription>
            </RowText>
            <Dropdown
              value={state.timeZone}
              onSelect={v => onChange({ timeZone: v })}
              values={timeZones.map(({ name, currentTimeFormat }) => ({
                label: currentTimeFormat,
                value: name
              }))}
            />
          </Row>
          <Row>
            <RowText>
              <RowTitle>Beta program</RowTitle>
              <RowDescription>Try new features before anyone else.</RowDescription>
            </RowText>
            <Toggle onChange={(e, bool) => onChange({ isBeta: bool })} value={state.isBeta} />
          </Row>
        </Card>
      </Section>
      <Section>
        <SectionHeader>
          <SectionTitle>Smart lists</SectionTitle>
        </SectionHeader>
        <SectionDescription>Choose which smart lists appear in your sidebar.</SectionDescription>
        <Card>
          {CUSTOM_LISTS.filter(list => !list.required).map(list => (
            <Row key={list.id}>
              <ListIcon>{list.icon}</ListIcon>
              <RowText>
                <RowTitle>{list.title}</RowTitle>
              </RowText>
              <Toggle
                onChange={(e, bool) => save({ customLists: { [list.id]: bool } })}
                value={customLists[list.id as keyof typeof customLists] || false}
              />
            </Row>
          ))}
        </Card>
      </Section>
      <Section>
        <SectionHeader>
          <SectionTitle>Wrapped</SectionTitle>
        </SectionHeader>
        <Card>
          <Row>
            <RowText>
              <RowTitle>Your recaps</RowTitle>
              <RowDescription>Monthly, yearly and all-time summaries of what you&apos;ve gotten done.</RowDescription>
            </RowText>
            <TinyButton onClick={() => navigate("/wrapped")}>View</TinyButton>
          </Row>
        </Card>
      </Section>
    </Page>
  );
}

export default Preferences;
