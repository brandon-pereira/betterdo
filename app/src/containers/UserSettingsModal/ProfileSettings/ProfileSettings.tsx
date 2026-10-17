import { useState } from "react";
import { useForm } from "@tanstack/react-form";

import { ButtonContainer, ProfilePictureBackground, ProfilePictureBanner } from "./ProfileSettings.styles";

import Button from "@components/Button";
import { Form, Label, Field, Input } from "@components/Forms";
import ProfilePic, { FormatProfilePictureUrl } from "@components/ProfilePic";
import useProfile from "@hooks/useProfile";
import useModifyProfile from "@hooks/useModifyProfile";
import { ServerError } from "@utilities/server";
import { profileSchema } from "@utilities/validation/profile";
import { fieldError } from "@utilities/forms";

function ProfileSettings() {
  const { profile, logout, loading } = useProfile();
  const modifyProfile = useModifyProfile();
  const [error, setError] = useState<string | undefined>(undefined);

  const form = useForm({
    defaultValues: {
      firstName: profile?.firstName || "",
      lastName: profile?.lastName || "",
      email: profile?.email || ""
    },
    validators: { onChange: profileSchema },
    onSubmit: async ({ value }) => {
      setError(undefined);
      try {
        await modifyProfile({
          firstName: value.firstName.trim(),
          lastName: value.lastName.trim()
        });
      } catch (err) {
        setError(err instanceof ServerError ? err.formattedMessage : ServerError.defaultError);
      }
    }
  });

  if (loading) {
    return <>Loading</>;
  }
  return (
    <Form
      errorMessage={error}
      onSubmit={e => {
        e.preventDefault();
        e.stopPropagation();
        form.handleSubmit();
      }}
    >
      <ProfilePictureBanner>
        <ProfilePictureBackground src={FormatProfilePictureUrl(profile?.profilePicture)} />
        <ProfilePic size="8rem" user={profile} />
      </ProfilePictureBanner>
      <Field>
        <Label htmlFor="firstName">First Name</Label>
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
      </Field>
      <Field>
        <Label htmlFor="lastName">Last Name</Label>
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
      </Field>
      <Field>
        <Label htmlFor="email">Email</Label>
        <Input value={form.state.values.email} name="email" id="email" disabled placeholder="hello@world.com" />
      </Field>
      <ButtonContainer>
        <form.Subscribe selector={state => state.isSubmitting}>
          {isSubmitting => (
            <Button isLoading={isSubmitting} loadingText="Saving" type="submit">
              Save
            </Button>
          )}
        </form.Subscribe>
        <Button onClick={logout} color={"red"}>
          Logout
        </Button>
      </ButtonContainer>
    </Form>
  );
}

export default ProfileSettings;
