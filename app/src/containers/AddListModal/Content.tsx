import { Fragment, useEffect, useState } from "react";
import randomColor from "randomcolor";
import { useForm } from "@tanstack/react-form";

import Button from "@components/Button";
import { Body, Header } from "@components/Copy";
import { Form, Label, Field, Input } from "@components/Forms";
import ColorPicker from "@components/ColorPicker";
import useCreateList from "@hooks/useCreateList";
import useAccessibleAccent from "@hooks/useAccessibleAccent";
import { ServerError } from "@utilities/server";
import { listSettingsSchema } from "@utilities/validation/list";
import { fieldError } from "@utilities/forms";

interface AddListModalProps {
  onLoad: () => void;
}

function AddListModalContent({ onLoad }: AddListModalProps) {
  const [error, setError] = useState<string | false>(false);
  const createList = useCreateList();
  const getAccessibleAccent = useAccessibleAccent();

  const form = useForm({
    defaultValues: { title: "", color: randomColor() },
    validators: { onChange: listSettingsSchema },
    onSubmit: async ({ value }) => {
      setError(false);
      try {
        await createList(value.title.trim(), value.color);
      } catch (err) {
        console.error(err);
        if (err instanceof ServerError) {
          setError(err.formattedMessage);
        }
      }
    }
  });

  useEffect(() => {
    if (onLoad && typeof onLoad === "function") {
      onLoad();
    }
  }, [onLoad]);

  return (
    <Fragment>
      <form.Subscribe selector={state => [state.values.color, state.isSubmitting] as const}>
        {([color, isSubmitting]) => {
          const accentColor = color ? getAccessibleAccent(color).toHex() : undefined;
          return (
            <Fragment>
              <Header color={accentColor}>Create List</Header>
              <Body>
                Lists allow you to organize your tasks with even more detail. You can create lists for almost anything.
              </Body>
              <Form
                errorMessage={error ? error : undefined}
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
                        onChange={evt => field.handleChange(evt.target.value)}
                        placeholder="ex. Groceries"
                      />
                    )}
                  </form.Field>
                </Field>
                <form.Field name="color">
                  {field => <ColorPicker value={field.state.value} onChange={c => field.handleChange(c)} />}
                </form.Field>
                <div>
                  <Button type="submit" loadingText="Creating" isLoading={isSubmitting} color={accentColor}>
                    Create
                  </Button>
                </div>
              </Form>
            </Fragment>
          );
        }}
      </form.Subscribe>
    </Fragment>
  );
}

export default AddListModalContent;
