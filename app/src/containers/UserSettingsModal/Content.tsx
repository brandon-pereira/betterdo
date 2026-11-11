import { useState, Fragment } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { theme } from "../../theme";

import Account from "./Account";
import Preferences from "./Preferences";
import Agents from "./Agents";
import About from "./About";

import Tabs, { Tab } from "@components/Tabs";
import { Header } from "@components/Copy";
import useGeneratedUrl from "@hooks/useGeneratedUrl";

const tabs = ["account", "preferences", "agents", "about"];

// Sections from before tabs were consolidated, so old links still land somewhere sensible.
const legacySections: Record<string, string> = {
  general: "preferences",
  "custom-lists": "preferences",
  profile: "account",
  auth: "account"
};

function UserSettingsModalContent() {
  const { section = "" } = useParams();
  const [selectedIndex, setSelectedIndex] = useState(() => {
    const tab = tabs.indexOf(legacySections[section] ?? section);
    return tab !== -1 ? tab : 0;
  });
  const generateUrl = useGeneratedUrl();
  const navigate = useNavigate();

  return (
    <Fragment>
      <Header color={theme.colors.general.blue}>Settings</Header>
      <Tabs
        onChange={index => {
          navigate(generateUrl(`/profile-settings/${tabs[index]}`));
          setSelectedIndex(index);
        }}
        selectedIndex={selectedIndex}
        color={theme.colors.general.blue}
        titles={["Account", "Preferences", "Agents", "About"]}
      >
        <Tab>
          <Account />
        </Tab>
        <Tab>
          <Preferences />
        </Tab>
        <Tab>
          <Agents />
        </Tab>
        <Tab>
          <About />
        </Tab>
      </Tabs>
    </Fragment>
  );
}

export default UserSettingsModalContent;
