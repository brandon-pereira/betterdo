import { useMemo, useState } from "react";

import {
  Section,
  SectionHeader,
  SectionDescription,
  InlineActions,
  PasskeyList,
  PasskeyItem,
  Subtle,
  Success,
  FormRow
} from "./AuthSettings.styles";

import Button from "@components/Button";
import { Body } from "@components/Copy";
import { Error, Form, Input, Label } from "@components/Forms";
import { authClient } from "@utilities/auth";

function AuthSettings() {
  const passkeyList = authClient.useListPasskeys ? authClient.useListPasskeys() : undefined;

  const [passkeyName, setPasskeyName] = useState("");
  const [passkeyError, setPasskeyError] = useState<string | null>(null);
  const [passkeyMessage, setPasskeyMessage] = useState<string | null>(null);
  const [isAddingPasskey, setIsAddingPasskey] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordMessage, setPasswordMessage] = useState<string | null>(null);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const passkeys = useMemo(() => {
    const raw = passkeyList?.data;
    if (!raw) return [];
    if (Array.isArray(raw)) return raw;
    return [];
  }, [passkeyList?.data]);

  const handleAddPasskey = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!authClient.passkey?.addPasskey) {
      setPasskeyError("Passkey registration is unavailable.");
      return;
    }
    setIsAddingPasskey(true);
    setPasskeyError(null);
    setPasskeyMessage(null);
    const res = await authClient.passkey.addPasskey({
      name: passkeyName || undefined
    });
    setIsAddingPasskey(false);
    if (res?.error) {
      setPasskeyError(res.error.message ?? "Unable to add passkey.");
      return;
    }
    setPasskeyMessage("Passkey registered. Follow your device prompts to finish.");
    setPasskeyName("");
    passkeyList?.refetch?.();
  };

  const handleChangePassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordMessage(null);

    if (!newPassword || newPassword !== confirmPassword) {
      setPasswordError("New passwords do not match.");
      return;
    }
    if (!authClient.changePassword) {
      setPasswordError("Password change is unavailable.");
      return;
    }
    setIsChangingPassword(true);
    const res = await authClient.changePassword({
      currentPassword,
      newPassword,
      revokeOtherSessions: true
    });
    setIsChangingPassword(false);
    if (res?.error) {
      setPasswordError(res.error.message ?? "Unable to change password.");
      return;
    }
    setPasswordMessage("Password updated.");
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
  };

  return (
    <div>
      <Section>
        <SectionHeader>Passkeys</SectionHeader>
        <SectionDescription>
          Register a passkey to sign in without a password. Your browser will prompt you to use Face ID, Touch ID, or a
          security key.
        </SectionDescription>
        <Form onSubmit={handleAddPasskey}>
          {passkeyError && <Error>{passkeyError}</Error>}
          {passkeyMessage && <Success>{passkeyMessage}</Success>}
          <FormRow>
            <Label htmlFor="passkey-name">Passkey label</Label>
            <Input
              id="passkey-name"
              name="passkey-name"
              value={passkeyName}
              onChange={evt => setPasskeyName(evt.target.value)}
              placeholder="Laptop or Security Key"
            />
            <InlineActions>
              <Button type="submit" isLoading={isAddingPasskey} loadingText="Saving">
                Save passkey
              </Button>
              <Subtle>Existing passkeys: {passkeys.length || 0}</Subtle>
            </InlineActions>
          </FormRow>
        </Form>
        <PasskeyList>
          {passkeys.length === 0 ? (
            <Subtle>No passkeys registered yet.</Subtle>
          ) : (
            passkeys.map(passkey => (
              <PasskeyItem key={passkey.id || passkey.name}>
                <span>{passkey.name || "Unnamed passkey"}</span>
                {passkey.createdAt && <Subtle>{new Date(passkey.createdAt).toLocaleString()}</Subtle>}
              </PasskeyItem>
            ))
          )}
        </PasskeyList>
      </Section>

      <Section>
        <SectionHeader>Password</SectionHeader>
        <SectionDescription>Update your password and sign out other active sessions.</SectionDescription>
        <Form onSubmit={handleChangePassword}>
          {passwordError && <Error>{passwordError}</Error>}
          {passwordMessage && <Success>{passwordMessage}</Success>}
          <FormRow>
            <Label htmlFor="currentPassword">Current password</Label>
            <Input
              id="currentPassword"
              name="currentPassword"
              type="password"
              autoComplete="current-password"
              value={currentPassword}
              onChange={evt => setCurrentPassword(evt.target.value)}
              placeholder="Enter current password"
            />
          </FormRow>
          <FormRow>
            <Label htmlFor="newPassword">New password</Label>
            <Input
              id="newPassword"
              name="newPassword"
              type="password"
              autoComplete="new-password"
              value={newPassword}
              onChange={evt => setNewPassword(evt.target.value)}
              placeholder="Enter new password"
            />
          </FormRow>
          <FormRow>
            <Label htmlFor="confirmPassword">Confirm new password</Label>
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={evt => setConfirmPassword(evt.target.value)}
              placeholder="Re-enter new password"
            />
          </FormRow>
          <InlineActions>
            <Button type="submit" isLoading={isChangingPassword} loadingText="Updating">
              Update password
            </Button>
            <Body as="div">You will stay signed in here; other sessions can be revoked automatically.</Body>
          </InlineActions>
        </Form>
      </Section>
    </div>
  );
}

export default AuthSettings;
