import { useEffect, useMemo, useState } from "react";
import { useForm } from "@tanstack/react-form";
import { formatDistanceToNow } from "date-fns";

import {
  Section,
  SectionHeader,
  SectionDescription,
  InlineActions,
  PasskeyList,
  PasskeyItem,
  PasskeyDetails,
  PasskeyActions,
  EmptyState,
  Subtle,
  Alert,
  FormRow,
  FormGrid,
  ConfirmRow,
  LoadingText,
  SmallButton,
  TinyButton
} from "./AuthSettings.styles";

import { Input, Label } from "@components/Forms";
import { authClient, useSession } from "@utilities/auth";
import { changePasswordSchema } from "@utilities/validation/auth";
import { fieldError, getErrorMessage } from "@utilities/forms";

interface Feedback {
  type: "success" | "error";
  message: string;
}

function AuthSettings() {
  const { data: session } = useSession();
  const passkeyList = authClient.useListPasskeys ? authClient.useListPasskeys() : undefined;

  // Whether the user has an email/password ("credential") account. Users who
  // signed up with Google only have a social account until they set a password.
  // `undefined` means we haven't resolved the account list yet.
  const [hasPassword, setHasPassword] = useState<boolean | undefined>(undefined);

  const [isSendingSetPassword, setIsSendingSetPassword] = useState(false);
  const [pwEmailFeedback, setPwEmailFeedback] = useState<Feedback | null>(null);

  const [passkeyFeedback, setPasskeyFeedback] = useState<Feedback | null>(null);
  const [isAddingPasskey, setIsAddingPasskey] = useState(false);
  const [isDeletingPasskeyId, setIsDeletingPasskeyId] = useState<string | null>(null);
  const [confirmingDeleteId, setConfirmingDeleteId] = useState<string | null>(null);

  const [passwordFeedback, setPasswordFeedback] = useState<Feedback | null>(null);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const passkeys = useMemo(() => {
    const raw = passkeyList?.data;
    if (!raw || !Array.isArray(raw)) return [];
    return raw;
  }, [passkeyList?.data]);

  useEffect(() => {
    let cancelled = false;
    const loadAccounts = async () => {
      const res = await authClient.listAccounts();
      if (cancelled) return;
      if (res.error || !res.data) {
        // If we can't determine account state, fall back to the change-password
        // form (the safer default for existing password users).
        setHasPassword(true);
        return;
      }
      setHasPassword(res.data.some(account => account.providerId === "credential"));
    };
    loadAccounts();
    return () => {
      cancelled = true;
    };
  }, []);

  const passkeyForm = useForm({
    defaultValues: { passkeyName: "" },
    onSubmit: async ({ value, formApi }) => {
      setPasskeyFeedback(null);
      if (!authClient.passkey?.addPasskey) {
        setPasskeyFeedback({ type: "error", message: "Passkey registration is unavailable." });
        return;
      }
      setIsAddingPasskey(true);
      const res = await authClient.passkey.addPasskey({
        name: value.passkeyName.trim() || undefined
      });

      setIsAddingPasskey(false);
      if (res?.error) {
        setPasskeyFeedback({ type: "error", message: getErrorMessage(res.error, "Unable to add passkey.") });
        return;
      }
      setPasskeyFeedback({ type: "success", message: "Passkey registered." });
      formApi.reset();
      passkeyList?.refetch?.();
    }
  });

  const passwordForm = useForm({
    defaultValues: { currentPassword: "", newPassword: "", confirmPassword: "" },
    validators: { onChange: changePasswordSchema },
    onSubmit: async ({ value, formApi }) => {
      setPasswordFeedback(null);
      if (!authClient.changePassword) {
        setPasswordFeedback({ type: "error", message: "Password change is unavailable." });
        return;
      }
      setIsChangingPassword(true);
      const res = await authClient.changePassword({
        currentPassword: value.currentPassword,
        newPassword: value.newPassword,
        revokeOtherSessions: true
      });
      setIsChangingPassword(false);
      if (res?.error) {
        setPasswordFeedback({ type: "error", message: getErrorMessage(res.error, "Unable to change password.") });
        return;
      }
      setPasswordFeedback({ type: "success", message: "Password updated. Other sessions were signed out." });
      formApi.reset();
    }
  });

  // Google-only users have no password to supply, so we can't use the
  // change-password flow. Instead we email them a reset link that lets them set
  // an initial password (better-auth's "request password reset" flow).
  const handleSendSetPassword = async () => {
    setPwEmailFeedback(null);

    const email = session?.user.email;
    if (!email) {
      setPwEmailFeedback({ type: "error", message: "We couldn't determine your email address." });
      return;
    }

    setIsSendingSetPassword(true);
    const res = await authClient.requestPasswordReset({
      email,
      redirectTo: `${window.location.origin}${import.meta.env.BASE_URL}auth/reset-password`
    });
    setIsSendingSetPassword(false);

    if (res?.error) {
      setPwEmailFeedback({ type: "error", message: res.error.message ?? "Unable to send the set-password email." });
      return;
    }
    setPwEmailFeedback({
      type: "success",
      message: `We sent a link to ${email}. Follow it to set your password.`
    });
  };

  const handleDeletePasskey = async (passkeyId: string) => {
    if (!authClient.$fetch) {
      setPasskeyFeedback({ type: "error", message: "Passkey deletion is unavailable." });
      return;
    }

    setIsDeletingPasskeyId(passkeyId);
    setConfirmingDeleteId(null);
    setPasskeyFeedback(null);

    const res = await authClient.$fetch<{ status: boolean }>("/passkey/delete-passkey", {
      method: "POST",
      body: { id: passkeyId },
      throw: false
    });

    setIsDeletingPasskeyId(null);

    if (res.error || !res.data?.status) {
      setPasskeyFeedback({ type: "error", message: res.error?.message ?? "Unable to delete passkey." });
      return;
    }
    setPasskeyFeedback({ type: "success", message: "Passkey removed." });
    passkeyList?.refetch?.();
  };

  return (
    <div>
      <Section>
        <SectionHeader>Passkeys</SectionHeader>
        <SectionDescription>
          Sign in without a password using Face ID, Touch ID, or a security key. Passkeys are faster and more secure
          than passwords.
        </SectionDescription>

        {passkeyFeedback && <Alert data-variant={passkeyFeedback.type}>{passkeyFeedback.message}</Alert>}

        <form
          onSubmit={e => {
            e.preventDefault();
            e.stopPropagation();
            passkeyForm.handleSubmit();
          }}
        >
          <FormRow>
            <Label htmlFor="passkey-name">Passkey name</Label>
            <passkeyForm.Field name="passkeyName">
              {field => (
                <Input
                  id="passkey-name"
                  name="passkey-name"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={evt => field.handleChange(evt.target.value)}
                  placeholder="e.g. MacBook, iPhone, YubiKey"
                />
              )}
            </passkeyForm.Field>
          </FormRow>
          <InlineActions style={{ marginTop: "0.75rem" }}>
            <SmallButton type="submit" isLoading={isAddingPasskey} loadingText="Adding">
              Add passkey
            </SmallButton>
          </InlineActions>
        </form>

        <PasskeyList>
          {passkeys.length === 0 ? (
            <EmptyState>No passkeys yet. Add one above to enable passwordless sign-in.</EmptyState>
          ) : (
            passkeys.map(passkey => {
              const isConfirming = confirmingDeleteId === passkey.id;
              const isDeleting = isDeletingPasskeyId === passkey.id;
              return (
                <PasskeyItem key={passkey.id || passkey.name}>
                  <PasskeyDetails>
                    <span>{passkey.name || "Unnamed passkey"}</span>
                    {passkey.createdAt && (
                      <Subtle>Added {formatDistanceToNow(new Date(passkey.createdAt), { addSuffix: true })}</Subtle>
                    )}
                  </PasskeyDetails>
                  <PasskeyActions>
                    {isConfirming ? (
                      <ConfirmRow>
                        <Subtle>Remove?</Subtle>
                        <TinyButton
                          variant="secondary"
                          color="red"
                          isLoading={isDeleting}
                          loadingText="Removing"
                          disabled={!passkey.id || isDeleting}
                          onClick={() => passkey.id && handleDeletePasskey(passkey.id)}
                        >
                          Yes
                        </TinyButton>
                        <TinyButton
                          variant="secondary"
                          disabled={isDeleting}
                          onClick={() => setConfirmingDeleteId(null)}
                        >
                          No
                        </TinyButton>
                      </ConfirmRow>
                    ) : (
                      <TinyButton
                        variant="secondary"
                        color="red"
                        disabled={!passkey.id || !!isDeletingPasskeyId}
                        onClick={() => passkey.id && setConfirmingDeleteId(passkey.id)}
                      >
                        Remove
                      </TinyButton>
                    )}
                  </PasskeyActions>
                </PasskeyItem>
              );
            })
          )}
        </PasskeyList>
      </Section>

      {hasPassword === undefined ? (
        <Section>
          <SectionHeader>Password</SectionHeader>
          <LoadingText>Loading account details…</LoadingText>
        </Section>
      ) : hasPassword === false ? (
        <Section>
          <SectionHeader>Set a password</SectionHeader>
          <SectionDescription>
            You signed in with Google and don&apos;t have a password yet. We&apos;ll email you a secure link so you can
            set one and also sign in with your email address.
          </SectionDescription>
          {pwEmailFeedback && <Alert data-variant={pwEmailFeedback.type}>{pwEmailFeedback.message}</Alert>}
          <InlineActions>
            <SmallButton onClick={handleSendSetPassword} isLoading={isSendingSetPassword} loadingText="Sending">
              Email me a set-up link
            </SmallButton>
          </InlineActions>
        </Section>
      ) : (
        <Section>
          <SectionHeader>Password</SectionHeader>
          <SectionDescription>
            Choose a new password. Changing it will sign you out of all other devices.
          </SectionDescription>
          {passwordFeedback && <Alert data-variant={passwordFeedback.type}>{passwordFeedback.message}</Alert>}
          <form
            onSubmit={e => {
              e.preventDefault();
              e.stopPropagation();
              passwordForm.handleSubmit();
            }}
          >
            <FormGrid>
              <FormRow>
                <Label htmlFor="currentPassword">Current password</Label>
                <passwordForm.Field name="currentPassword">
                  {field => (
                    <Input
                      id="currentPassword"
                      name="currentPassword"
                      type="password"
                      autoComplete="current-password"
                      value={field.state.value}
                      errorMessage={fieldError(field.state.meta)}
                      onBlur={field.handleBlur}
                      onChange={evt => field.handleChange(evt.target.value)}
                      placeholder="Enter current password"
                    />
                  )}
                </passwordForm.Field>
              </FormRow>
              <FormRow>
                <Label htmlFor="newPassword">New password</Label>
                <passwordForm.Field name="newPassword">
                  {field => (
                    <Input
                      id="newPassword"
                      name="newPassword"
                      type="password"
                      autoComplete="new-password"
                      value={field.state.value}
                      errorMessage={fieldError(field.state.meta)}
                      onBlur={field.handleBlur}
                      onChange={evt => field.handleChange(evt.target.value)}
                      placeholder="At least 8 characters"
                    />
                  )}
                </passwordForm.Field>
              </FormRow>
              <FormRow>
                <Label htmlFor="confirmPassword">Confirm new password</Label>
                <passwordForm.Field name="confirmPassword">
                  {field => (
                    <Input
                      id="confirmPassword"
                      name="confirmPassword"
                      type="password"
                      autoComplete="new-password"
                      value={field.state.value}
                      errorMessage={fieldError(field.state.meta)}
                      onBlur={field.handleBlur}
                      onChange={evt => field.handleChange(evt.target.value)}
                      placeholder="Re-enter new password"
                    />
                  )}
                </passwordForm.Field>
              </FormRow>
            </FormGrid>
            <InlineActions style={{ marginTop: "1rem" }}>
              <SmallButton type="submit" isLoading={isChangingPassword} loadingText="Updating">
                Update password
              </SmallButton>
            </InlineActions>
          </form>
        </Section>
      )}
    </div>
  );
}

export default AuthSettings;
