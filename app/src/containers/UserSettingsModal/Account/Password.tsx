import { Fragment, useEffect, useState } from "react";
import { useForm } from "@tanstack/react-form";

import Accordion from "../Accordion";
import { Alert, FormGrid, InlineActions, RowDescription, TinyButton } from "../Settings.styles";

import { Input, Label } from "@components/Forms";
import { authClient, useSession } from "@utilities/auth";
import { changePasswordSchema } from "@utilities/validation/auth";
import { fieldError, getErrorMessage } from "@utilities/forms";

interface Feedback {
  type: "success" | "error";
  message: string;
}

const passwordFields = [
  {
    name: "currentPassword",
    label: "Current password",
    autoComplete: "current-password",
    placeholder: "Enter current password"
  },
  { name: "newPassword", label: "New password", autoComplete: "new-password", placeholder: "At least 8 characters" },
  {
    name: "confirmPassword",
    label: "Confirm new password",
    autoComplete: "new-password",
    placeholder: "Re-enter new password"
  }
] as const;

function Password() {
  const { data: session } = useSession();
  // Whether the user has an email/password ("credential") account. Users who
  // signed up with Google only have a social account until they set a password.
  // `undefined` means we haven't resolved the account list yet.
  const [hasPassword, setHasPassword] = useState<boolean | undefined>(undefined);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<Feedback | null>(null);

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

  const form = useForm({
    defaultValues: { currentPassword: "", newPassword: "", confirmPassword: "" },
    validators: { onChange: changePasswordSchema },
    onSubmit: async ({ value, formApi }) => {
      setFeedback(null);
      if (!authClient.changePassword) {
        setFeedback({ type: "error", message: "Password change is unavailable." });
        return;
      }
      setIsSubmitting(true);
      const res = await authClient.changePassword({
        currentPassword: value.currentPassword,
        newPassword: value.newPassword,
        revokeOtherSessions: true
      });
      setIsSubmitting(false);
      if (res?.error) {
        setFeedback({ type: "error", message: getErrorMessage(res.error, "Unable to change password.") });
        return;
      }
      setFeedback({ type: "success", message: "Password updated. Other devices were signed out." });
      formApi.reset();
    }
  });

  // Google-only users have no password to supply, so we can't use the
  // change-password flow. Instead we email them a reset link that lets them set
  // an initial password (better-auth's "request password reset" flow).
  const handleSendSetPassword = async () => {
    setFeedback(null);
    const email = session?.user.email;
    if (!email) {
      setFeedback({ type: "error", message: "We couldn't determine your email address." });
      return;
    }
    setIsSubmitting(true);
    const res = await authClient.requestPasswordReset({
      email,
      redirectTo: `${window.location.origin}${import.meta.env.BASE_URL}auth/reset-password`
    });
    setIsSubmitting(false);
    if (res?.error) {
      setFeedback({ type: "error", message: res.error.message ?? "Unable to send the set-password email." });
      return;
    }
    setFeedback({ type: "success", message: `We sent a link to ${email}. Follow it to set your password.` });
  };

  const summary = hasPassword === undefined ? "Loading…" : hasPassword ? "Set" : "Not set";

  return (
    <Accordion title="Password" summary={summary}>
      {feedback && <Alert data-variant={feedback.type}>{feedback.message}</Alert>}
      {hasPassword === false && (
        <Fragment>
          <RowDescription>
            You signed in with Google. We&apos;ll email you a link to set a password so you can also sign in with your
            email.
          </RowDescription>
          <InlineActions>
            <TinyButton onClick={handleSendSetPassword} isLoading={isSubmitting} loadingText="Sending">
              Email setup link
            </TinyButton>
          </InlineActions>
        </Fragment>
      )}
      {hasPassword === true && (
        <form
          onSubmit={e => {
            e.preventDefault();
            e.stopPropagation();
            form.handleSubmit();
          }}
        >
          <RowDescription style={{ marginBottom: "0.85rem" }}>
            Changing your password signs you out of all other devices.
          </RowDescription>
          <FormGrid>
            {passwordFields.map(({ name, label, autoComplete, placeholder }) => (
              <div key={name}>
                <Label htmlFor={name}>{label}</Label>
                <form.Field name={name}>
                  {field => (
                    <Input
                      id={name}
                      name={name}
                      type="password"
                      autoComplete={autoComplete}
                      value={field.state.value}
                      errorMessage={fieldError(field.state.meta)}
                      onBlur={field.handleBlur}
                      onChange={evt => field.handleChange(evt.target.value)}
                      placeholder={placeholder}
                    />
                  )}
                </form.Field>
              </div>
            ))}
          </FormGrid>
          <InlineActions style={{ marginTop: "0.85rem" }}>
            <TinyButton type="submit" isLoading={isSubmitting} loadingText="Updating">
              Update password
            </TinyButton>
          </InlineActions>
        </form>
      )}
    </Accordion>
  );
}

export default Password;
