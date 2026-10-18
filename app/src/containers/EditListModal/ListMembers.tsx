import { useState, useCallback } from "react";
import { useForm } from "@tanstack/react-form";
import { styled } from "@linaria/react";

import { theme } from "../../theme";

import Button from "@components/Button";
import { Form, Label, Field, Input } from "@components/Forms";
import ProfilePic from "@components/ProfilePic";
import useCurrentListId from "@hooks/useCurrentListId";
import useListDetails from "@hooks/useListDetails";
import { getUserByEmail, ServerError } from "@utilities/server";
import useModifyList from "@hooks/useModifyList";
import { addMemberSchema } from "@utilities/validation/list";
import { fieldError } from "@utilities/forms";
import { ButtonContainer } from "@components/NotificationBanner/NotificationBanner.styles";

const UserList = styled.ol`
  list-style: none;
  padding: 0;
  margin: 0;
  max-height: 12.5rem;
  overflow-y: auto;
`;
const Owner = styled.div`
  color: ${theme.colors.body.color};
  text-transform: uppercase;
  font-weight: bold;
  &:before {
    content: "OWNER";
  }
`;
const UsersName = styled.div`
  flex: 1;
  text-overflow: ellipsis;
  white-space: nowrap;
  overflow: hidden;
`;

const User = styled.li`
  display: flex;
  align-items: center;
  padding: 1rem;
  border-radius: 1rem;
  color: ${theme.colors.body.color};
  ${ProfilePic} {
    margin-right: 1rem;
  }
  &:nth-of-type(odd) {
    background: ${theme.colors.modals.listViewAlternateBackground};
  }
`;

function ListMembers() {
  const [error, setError] = useState<string | undefined>();
  const currentListId = useCurrentListId();
  const modifyList = useModifyList();
  const { list } = useListDetails(currentListId);
  const [members, setMembers] = useState(list.members!);

  const removeMember = useCallback(
    async (id: string) => {
      // Temporarily update UI while request sends
      const _members = members.filter(member => member.id !== id);
      setMembers(_members);
      // Make actual request
      await modifyList(currentListId, {
        members: _members
      });
    },
    [members, currentListId, modifyList]
  );

  const form = useForm({
    defaultValues: { email: "" },
    validators: { onChange: addMemberSchema },
    onSubmit: async ({ value, formApi }) => {
      setError(undefined);
      try {
        const user = await getUserByEmail(value.email.trim());
        if (members.find(m => m.id === user.id)) {
          setError("User already exists on list");
          return;
        }
        const nextMembers = [...members, user];
        setMembers(nextMembers);
        await modifyList(currentListId, { members: nextMembers });
        formApi.reset();
      } catch (err) {
        console.error(err);
        setError(err instanceof ServerError ? err.formattedMessage : ServerError.defaultError);
      }
    }
  });

  return (
    <Form
      errorMessage={error}
      onSubmit={e => {
        e.preventDefault();
        e.stopPropagation();
        form.handleSubmit();
      }}
    >
      <Field>
        <Label>Current Members</Label>
        <UserList>
          {list.members?.map((user, index) => (
            <User key={index}>
              <ProfilePic user={user} />
              <UsersName>
                {user.firstName} {user.lastName}
              </UsersName>
              {user.id === list.owner ? <Owner /> : <Button onClick={() => removeMember(user.id)}>Remove</Button>}
            </User>
          ))}
        </UserList>
      </Field>
      <Field>
        <Label htmlFor="email">Add Member</Label>
        <form.Field name="email">
          {field => (
            <Input
              value={field.state.value}
              name="email"
              id="email"
              errorMessage={fieldError(field.state.meta)}
              onBlur={field.handleBlur}
              onChange={evt => field.handleChange(evt.target.value)}
              placeholder="hello@world.com"
            />
          )}
        </form.Field>
      </Field>
      <ButtonContainer>
        <form.Subscribe selector={state => state.isSubmitting}>
          {isSubmitting => (
            <Button isLoading={isSubmitting} loadingText="Adding" color={list.color} type="submit">
              Add
            </Button>
          )}
        </form.Subscribe>
      </ButtonContainer>
    </Form>
  );
}

export default ListMembers;
