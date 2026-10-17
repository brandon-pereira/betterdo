import { useState, useCallback, useEffect } from "react";
import { useForm } from "@tanstack/react-form";
import { styled } from "@linaria/react";

import Button from "@components/Button";
import { Form, Label, Field, Input } from "@components/Forms";
import ColorPicker from "@components/ColorPicker";
import useCurrentListId from "@hooks/useCurrentListId";
import useModifyList from "@hooks/useModifyList";
import useListDetails from "@hooks/useListDetails";
import useDeleteList from "@hooks/useDeleteList";
import { ServerError } from "@utilities/server";
import { checkIfColorGoodContrast } from "@utilities/colors";
import { useResolvedTheme } from "@utilities/ThemeProvider";
import { listSettingsSchema } from "@utilities/validation/list";
import { fieldError } from "@utilities/forms";

const ButtonContainer = styled.div`
  display: flex;
  justify-content: space-between;
  margin-top: 1.5rem;
`;

interface Props {
  setUnsavedChanges: (bool: boolean) => void;
  onRequestClose: () => void;
}
function ListSettings({ setUnsavedChanges, onRequestClose }: Props) {
  const currentListId = useCurrentListId();
  const { list } = useListDetails(currentListId);
  const modifyList = useModifyList();
  const _deleteList = useDeleteList();
  const [isDeleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const { modalContentBackground } = useResolvedTheme();

  const form = useForm({
    defaultValues: { title: list.title, color: list.color },
    validators: { onChange: listSettingsSchema },
    onSubmit: async ({ value }) => {
      setError(undefined);
      try {
        await modifyList(currentListId, value);
      } catch (err) {
        console.error(err);
        setError(err instanceof ServerError ? err.formattedMessage : ServerError.defaultError);
        return;
      }
      setUnsavedChanges(false);
      onRequestClose?.();
    }
  });

  // Re-seed the form when the list resolves/changes (unless mid-edit).
  useEffect(() => {
    if (!form.state.isDirty) {
      form.reset({ title: list.title, color: list.color });
    }
  }, [list, form]);

  const deleteList = useCallback(async () => {
    const result = confirm(
      `Are you sure you want to delete the list "${form.state.values.title}"? This can't be undone.`
    );
    if (result) {
      setDeleting(true);
      try {
        await _deleteList(currentListId);
      } catch (err) {
        console.error(err);
        setError(err instanceof ServerError ? err.formattedMessage : ServerError.defaultError);
        setDeleting(false);
      }
    }
  }, [_deleteList, currentListId, form]);

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
        <Label htmlFor="name">List Name</Label>
        <form.Field name="title">
          {field => (
            <Input
              value={field.state.value}
              name="name"
              id="name"
              errorMessage={fieldError(field.state.meta)}
              onBlur={field.handleBlur}
              onChange={evt => {
                setUnsavedChanges(true);
                field.handleChange(evt.target.value);
              }}
              placeholder="ex. Groceries"
            />
          )}
        </form.Field>
      </Field>
      <form.Field name="color">
        {field => (
          <ColorPicker
            value={field.state.value}
            onChange={color => {
              setUnsavedChanges(true);
              field.handleChange(color);
            }}
          />
        )}
      </form.Field>
      <ButtonContainer>
        <form.Subscribe selector={state => [state.values.color, state.isSubmitting] as const}>
          {([color, isSubmitting]) => (
            <Button
              isLoading={isSubmitting}
              loadingText="Saving"
              color={checkIfColorGoodContrast(color || "#000", modalContentBackground) ? color : undefined}
              type="submit"
            >
              Save
            </Button>
          )}
        </form.Subscribe>
        <Button isLoading={isDeleting} loadingText="Deleting" onClick={deleteList} color={"red"} type="button">
          Delete
        </Button>
      </ButtonContainer>
    </Form>
  );
}

export default ListSettings;
