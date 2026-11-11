import { Fragment, useState } from "react";
import { formatDistanceToNow } from "date-fns";

import { AppIcon } from "./Agents.styles";
import {
  Alert,
  Card,
  EmptyState,
  LoadingText,
  Row,
  RowActions,
  RowBody,
  RowDescription,
  RowText,
  RowTitle,
  Section,
  SectionDescription,
  SectionHeader,
  SectionTitle,
  Subtle,
  TinyButton
} from "../Settings.styles";

import useConnectedApps from "@hooks/useConnectedApps";
import { getErrorMessage } from "@utilities/forms";

interface Feedback {
  type: "success" | "error";
  message: string;
}

const relative = (date: string) => formatDistanceToNow(new Date(date), { addSuffix: true });

function ConnectedAgents() {
  const { apps, loading, error, disconnect } = useConnectedApps();
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [disconnectingId, setDisconnectingId] = useState<string | null>(null);

  const handleDisconnect = async (clientId: string) => {
    setConfirmingId(null);
    setDisconnectingId(clientId);
    setFeedback(null);
    try {
      await disconnect(clientId);
      setFeedback({ type: "success", message: "Agent disconnected." });
    } catch (err) {
      setFeedback({ type: "error", message: getErrorMessage(err, "Unable to disconnect agent.") });
    } finally {
      setDisconnectingId(null);
    }
  };

  const renderContent = () => {
    if (loading) {
      return <LoadingText>Loading connected agents…</LoadingText>;
    }
    if (apps.length === 0) {
      return (
        <RowBody style={{ paddingTop: "1rem" }}>
          <EmptyState>No agents connected yet. Follow the steps above to connect one.</EmptyState>
        </RowBody>
      );
    }
    return apps.map(app => {
      const isConfirming = confirmingId === app.clientId;
      const isDisconnecting = disconnectingId === app.clientId;
      const name = app.name || "Unnamed agent";
      return (
        <Row key={app.clientId}>
          <AppIcon aria-hidden="true">{app.icon ? <img src={app.icon} alt="" /> : name.charAt(0)}</AppIcon>
          <RowText>
            <RowTitle>{name}</RowTitle>
            <RowDescription>
              {app.connectedAt && `Connected ${relative(app.connectedAt)}`}
              {app.lastActiveAt && app.lastActiveAt !== app.connectedAt
                ? ` · Last active ${relative(app.lastActiveAt)}`
                : ""}
            </RowDescription>
          </RowText>
          <RowActions>
            {isConfirming ? (
              <Fragment>
                <Subtle>Disconnect?</Subtle>
                <TinyButton
                  variant="secondary"
                  color="red"
                  isLoading={isDisconnecting}
                  loadingText="Disconnecting"
                  disabled={isDisconnecting}
                  onClick={() => handleDisconnect(app.clientId)}
                >
                  Yes
                </TinyButton>
                <TinyButton variant="secondary" disabled={isDisconnecting} onClick={() => setConfirmingId(null)}>
                  No
                </TinyButton>
              </Fragment>
            ) : (
              <TinyButton
                variant="secondary"
                color="red"
                isLoading={isDisconnecting}
                loadingText="Disconnecting"
                disabled={!!disconnectingId}
                onClick={() => setConfirmingId(app.clientId)}
              >
                Disconnect
              </TinyButton>
            )}
          </RowActions>
        </Row>
      );
    });
  };

  return (
    <Section>
      <SectionHeader>
        <SectionTitle>Connected agents</SectionTitle>
      </SectionHeader>
      <SectionDescription>
        Agents you&apos;ve approved can view and update your lists and tasks. Disconnecting one revokes its access
        immediately.
      </SectionDescription>
      {feedback && <Alert data-variant={feedback.type}>{feedback.message}</Alert>}
      {error && <Alert data-variant="error">Unable to load connected agents.</Alert>}
      <Card>{renderContent()}</Card>
    </Section>
  );
}

export default ConnectedAgents;
