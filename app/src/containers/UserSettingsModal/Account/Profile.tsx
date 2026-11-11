import { useState } from "react";
import { useForm } from "@tanstack/react-form";

import {
  Alert,
  Card,
  InlineActions,
  Row,
  RowBody,
  RowDescription,
  RowText,
  RowTitle,
  Section,
  SectionHeader,
  SectionTitle,
  SmallButton
} from "../Settings.styles";
import { NameFields } from "./Account.styles";

import { Label, Input } from "@components/Forms";
import ProfilePic from "@components/ProfilePic";
import useProfile from "@hooks/useProfile";
import useModifyProfile from "@hooks/useModifyProfile";
import { ServerError } from "@utilities/server";
import { profileSchema } from "@utilities/validation/profile";
import { fieldError } from "@utilities/forms";

function Profile() {
  const { profile } = useProfile();
  const modifyProfile = useModifyProfile();
  const [error, setError] = useState<string | undefined>(undefined);

  const form = useForm({
    defaultValues: {
      firstName: profile?.firstName || "",
      lastName: profile?.lastName || "",
      email: profile?.email || ""
    },
    validators: { onChange: profileSchema },
    onSubmit: async ({ value, formApi }) => {
      setError(undefined);
      try {
        await modifyProfile({
          firstName: value.firstName.trim(),
          lastName: value.lastName.trim()
        });
        formApi.reset(value);
      } catch (err) {
        setError(err instanceof ServerError ? err.formattedMessage : ServerError.defaultError);
      }
    }
  });

  return (
    <Section>
      <SectionHeader>
        <SectionTitle>Profile</SectionTitle>
      </SectionHeader>
      <Card>
        <Row>
          <ProfilePic size="3.25rem" user={profile} />
          <RowText>
            <RowTitle>
              {profile?.firstName} {profile?.lastName}
            </RowTitle>
            <RowDescription>{profile?.email}</RowDescription>
          </RowText>
        </Row>
        <RowBody>
          {error && <Alert data-variant="error">{error}</Alert>}
          <form
            onSubmit={e => {
              e.preventDefault();
              e.stopPropagation();
              form.handleSubmit();
            }}
          >
            <NameFields>
              <div>
                <Label htmlFor="firstName">First name</Label>
                <form.Field name="firstName">
                  {field => (
                    <Input
                      value={field.state.value}
                      name="firstName"
                      id="firstName"
                      errorMessage={fieldError(field.state.meta)}
                      onBlur={field.handleBlur}
                      onChange={evt => field.handleChange(evt.target.value)}
                      placeholder="John"
                    />
                  )}
                </form.Field>
              </div>
              <div>
                <Label htmlFor="lastName">Last name</Label>
                <form.Field name="lastName">
                  {field => (
                    <Input
                      value={field.state.value}
                      name="lastName"
                      id="lastName"
                      onBlur={field.handleBlur}
                      onChange={evt => field.handleChange(evt.target.value)}
                      placeholder="Doe"
                    />
                  )}
                </form.Field>
              </div>
            </NameFields>
            <form.Subscribe selector={state => [state.isSubmitting, state.isDirty] as const}>
              {([isSubmitting, isDirty]) =>
                isDirty || isSubmitting ? (
                  <InlineActions style={{ marginTop: "0.75rem" }}>
                    <SmallButton isLoading={isSubmitting} loadingText="Saving" type="submit">
                      Save changes
                    </SmallButton>
                  </InlineActions>
                ) : null
              }
            </form.Subscribe>
          </form>
        </RowBody>
      </Card>
    </Section>
  );
}

export default Profile;
