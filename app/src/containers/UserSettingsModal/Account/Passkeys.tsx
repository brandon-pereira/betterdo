import { Fragment, useMemo, useState } from "react";
import { useForm } from "@tanstack/react-form";
import { formatDistanceToNow } from "date-fns";

import Accordion from "../Accordion";
import {
  Alert,
  InlineActions,
  Item,
  ItemList,
  RowActions,
  RowDescription,
  RowText,
  RowTitle,
  Subtle,
  TinyButton
} from "../Settings.styles";

import { Input } from "@components/Forms";
import { authClient } from "@utilities/auth";
import { getErrorMessage } from "@utilities/forms";

interface Feedback {
  type: "success" | "error";
  message: string;
}

function Passkeys() {
  const passkeyList = authClient.useListPasskeys ? authClient.useListPasskeys() : undefined;
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);

  const passkeys = useMemo(() => {
    const raw = passkeyList?.data;
    if (!raw || !Array.isArray(raw)) return [];
    return raw;
  }, [passkeyList?.data]);

  const form = useForm({
    defaultValues: { passkeyName: "" },
    onSubmit: async ({ value, formApi }) => {
      setFeedback(null);
      if (!authClient.passkey?.addPasskey) {
        setFeedback({ type: "error", message: "Passkey registration is unavailable." });
        return;
      }
      setIsAdding(true);
      const res = await authClient.passkey.addPasskey({
        name: value.passkeyName.trim() || undefined
      });
      setIsAdding(false);
      if (res?.error) {
        setFeedback({ type: "error", message: getErrorMessage(res.error, "Unable to add passkey.") });
        return;
      }
      setFeedback({ type: "success", message: "Passkey registered." });
      setIsFormOpen(false);
      formApi.reset();
      passkeyList?.refetch?.();
    }
  });

  const handleDelete = async (passkeyId: string) => {
    if (!authClient.$fetch) {
      setFeedback({ type: "error", message: "Passkey deletion is unavailable." });
      return;
    }
    setDeletingId(passkeyId);
    setConfirmingId(null);
    setFeedback(null);

    const res = await authClient.$fetch<{ status: boolean }>("/passkey/delete-passkey", {
      method: "POST",
      body: { id: passkeyId },
      throw: false
    });

    setDeletingId(null);
    if (res.error || !res.data?.status) {
      setFeedback({ type: "error", message: res.error?.message ?? "Unable to delete passkey." });
      return;
    }
    setFeedback({ type: "success", message: "Passkey removed." });
    passkeyList?.refetch?.();
  };

  const summary =
    passkeys.length === 0 ? "None added yet" : `${passkeys.length} passkey${passkeys.length === 1 ? "" : "s"}`;

  return (
    <Accordion title="Passkeys" summary={summary}>
      <RowDescription>Sign in with Face ID, Touch ID, or a security key instead of a password.</RowDescription>
      {feedback && <Alert data-variant={feedback.type}>{feedback.message}</Alert>}
      {passkeys.length > 0 && (
        <ItemList>
          {passkeys.map(passkey => {
            const isConfirming = confirmingId === passkey.id;
            const isDeleting = deletingId === passkey.id;
            return (
              <Item key={passkey.id || passkey.name}>
                <RowText>
                  <RowTitle style={{ fontWeight: 500, fontSize: "0.9rem" }}>
                    {passkey.name || "Unnamed passkey"}
                  </RowTitle>
                  {passkey.createdAt && (
                    <Subtle>Added {formatDistanceToNow(new Date(passkey.createdAt), { addSuffix: true })}</Subtle>
                  )}
                </RowText>
                <RowActions>
                  {isConfirming ? (
                    <Fragment>
                      <Subtle>Remove?</Subtle>
                      <TinyButton
                        variant="secondary"
                        color="red"
                        isLoading={isDeleting}
                        loadingText="Removing"
                        disabled={!passkey.id || isDeleting}
                        onClick={() => passkey.id && handleDelete(passkey.id)}
                      >
                        Yes
                      </TinyButton>
                      <TinyButton variant="secondary" disabled={isDeleting} onClick={() => setConfirmingId(null)}>
                        No
                      </TinyButton>
                    </Fragment>
                  ) : (
                    <TinyButton
                      variant="secondary"
                      color="red"
                      disabled={!passkey.id || !!deletingId}
                      onClick={() => passkey.id && setConfirmingId(passkey.id)}
                    >
                      Remove
                    </TinyButton>
                  )}
                </RowActions>
              </Item>
            );
          })}
        </ItemList>
      )}
      {isFormOpen ? (
        <form
          onSubmit={e => {
            e.preventDefault();
            e.stopPropagation();
            form.handleSubmit();
          }}
        >
          <form.Field name="passkeyName">
            {field => (
              <Input
                id="passkey-name"
                name="passkey-name"
                autoFocus
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={evt => field.handleChange(evt.target.value)}
                placeholder="Name this passkey (e.g. MacBook, iPhone)"
              />
            )}
          </form.Field>
          <InlineActions style={{ marginTop: "0.75rem" }}>
            <TinyButton type="submit" isLoading={isAdding} loadingText="Adding">
              Continue
            </TinyButton>
            <TinyButton variant="secondary" disabled={isAdding} onClick={() => setIsFormOpen(false)}>
              Cancel
            </TinyButton>
          </InlineActions>
        </form>
      ) : (
        <InlineActions>
          <TinyButton
            onClick={() => {
              setFeedback(null);
              setIsFormOpen(true);
            }}
          >
            Add passkey
          </TinyButton>
        </InlineActions>
      )}
    </Accordion>
  );
}

export default Passkeys;
