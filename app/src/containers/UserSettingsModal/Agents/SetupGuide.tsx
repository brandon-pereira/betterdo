import { useState } from "react";
import type { ReactNode } from "react";

import CopyableCode from "./CopyableCode";
import { ClientOption, ClientPicker, Steps } from "./Agents.styles";
import { Card, RowBody, Section, SectionDescription, SectionHeader, SectionTitle } from "../Settings.styles";

interface Client {
  id: string;
  label: string;
  steps: (url: string) => ReactNode[];
}

const clients: Client[] = [
  {
    id: "claude",
    label: "Claude",
    steps: url => [
      <>
        In Claude, open <strong>Settings → Connectors</strong> and choose <strong>Add custom connector</strong>.
      </>,
      <>
        Name it BetterDo and paste this URL:
        <CopyableCode value={url} />
      </>,
      <>
        Click <strong>Connect</strong>, then approve access when BetterDo asks.
      </>
    ]
  },
  {
    id: "chatgpt",
    label: "ChatGPT",
    steps: url => [
      <>
        In ChatGPT, turn on <strong>Developer mode</strong> under <strong>Settings → Apps → Advanced settings</strong>.
      </>,
      <>
        Create a new app named BetterDo, choose OAuth, and paste this URL:
        <CopyableCode value={url} />
      </>,
      <>Approve access when BetterDo asks.</>
    ]
  },
  {
    id: "other",
    label: "Other",
    steps: url => [
      <>
        Most assistants that support MCP connectors work with BetterDo. Add a new connector with this URL:
        <CopyableCode value={url} />
      </>,
      <>Sign in and approve access when BetterDo asks.</>
    ]
  }
];

interface Props {
  serverUrl: string;
}

function SetupGuide({ serverUrl }: Props) {
  const [clientId, setClientId] = useState(clients[0].id);
  const client = clients.find(c => c.id === clientId) ?? clients[0];

  return (
    <Section>
      <SectionHeader>
        <SectionTitle>Connect an agent</SectionTitle>
      </SectionHeader>
      <SectionDescription>
        Agents can read and update your lists and tasks, but can&apos;t delete anything.
      </SectionDescription>
      <Card>
        <RowBody style={{ paddingTop: "1rem" }}>
          <ClientPicker role="group" aria-label="Agent app">
            {clients.map(c => (
              <ClientOption
                key={c.id}
                type="button"
                aria-pressed={c.id === client.id}
                onClick={() => setClientId(c.id)}
              >
                {c.label}
              </ClientOption>
            ))}
          </ClientPicker>
          <Steps>
            {client.steps(serverUrl).map((step, index) => (
              <li key={index}>{step}</li>
            ))}
          </Steps>
        </RowBody>
      </Card>
    </Section>
  );
}

export default SetupGuide;
