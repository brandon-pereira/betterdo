import { useState } from "react";
import { formatDistanceToNow } from "date-fns";

import {
  Section,
  SectionHeader,
  SectionDescription,
  PasskeyList,
  PasskeyItem,
  PasskeyDetails,
  PasskeyActions,
  EmptyState,
  Subtle,
  Alert,
  ConfirmRow,
  LoadingText,
  TinyButton
} from "./AuthSettings.styles";

import useConnectedApps from "@hooks/useConnectedApps";
import { getErrorMessage } from "@utilities/forms";

interface Feedback {
  type: "success" | "error";
  message: string;
}

const relative = (date: string) => formatDistanceToNow(new Date(date), { addSuffix: true });

function ConnectedApps() {
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
      setFeedback({ type: "success", message: "App disconnected." });
    } catch (err) {
      setFeedback({ type: "error", message: getErrorMessage(err, "Unable to disconnect app.") });
    } finally {
      setDisconnectingId(null);
    }
  };

  return (
    <Section>
      <SectionHeader>Connected apps</SectionHeader>
      <SectionDescription>
        AI assistants and other apps you&apos;ve allowed to view and update your lists and tasks. Disconnecting an app
        revokes its access immediately.
      </SectionDescription>

      {feedback && <Alert data-variant={feedback.type}>{feedback.message}</Alert>}
      {error && <Alert data-variant="error">Unable to load connected apps.</Alert>}

      {loading ? (
        <LoadingText>Loading connected apps…</LoadingText>
      ) : (
        <PasskeyList>
          {apps.length === 0 ? (
            <EmptyState>
              No connected apps yet. Apps appear here after you allow them to access your account.
            </EmptyState>
          ) : (
            apps.map(app => {
              const isConfirming = confirmingId === app.clientId;
              const isDisconnecting = disconnectingId === app.clientId;
              return (
                <PasskeyItem key={app.clientId}>
                  <PasskeyDetails>
                    <span>{app.name || "Unnamed app"}</span>
                    <Subtle>
                      {app.connectedAt && `Connected ${relative(app.connectedAt)}`}
                      {app.lastActiveAt && app.lastActiveAt !== app.connectedAt
                        ? ` · Last active ${relative(app.lastActiveAt)}`
                        : ""}
                    </Subtle>
                  </PasskeyDetails>
                  <PasskeyActions>
                    {isConfirming ? (
                      <ConfirmRow>
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
                        <TinyButton
                          variant="secondary"
                          disabled={isDisconnecting}
                          onClick={() => setConfirmingId(null)}
                        >
                          No
                        </TinyButton>
                      </ConfirmRow>
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
                  </PasskeyActions>
                </PasskeyItem>
              );
            })
          )}
        </PasskeyList>
      )}
    </Section>
  );
}

export default ConnectedApps;
