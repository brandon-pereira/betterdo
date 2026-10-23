import { useForm } from "@tanstack/react-form";
import { fieldError } from "@utilities/forms";
import { Container, Input } from "./AddTask.styles";

import useCreateTask from "@hooks/useCreateTask";
import useCurrentListId from "@hooks/useCurrentListId";
import { vibrate } from "@utilities/haptics";
import { addTaskSchema } from "@utilities/validation/list";

interface Props {
  isHidden: boolean;
  isAbsolute: boolean;
}

const AddTask = function ({ isHidden, isAbsolute }: Props) {
  const currentListId = useCurrentListId();
  const createTask = useCreateTask();

  const form = useForm({
    defaultValues: { title: "" },
    validators: { onChange: addTaskSchema },
    onSubmitInvalid: () => vibrate("error"),
    onSubmit: async ({ value, formApi }) => {
      const title = value.title.trim();
      formApi.reset();
      try {
        await createTask(currentListId, title);
        vibrate("success");
      } catch (err) {
        console.error(err);
        // Restore the title for easy re-adding.
        formApi.setFieldValue("title", value.title);
        vibrate("error");
      }
    }
  });

  return (
    <Container
      data-absolute={isAbsolute ? "true" : "false"}
      data-hidden={isHidden ? "true" : "false"}
      onSubmit={e => {
        e.preventDefault();
        e.stopPropagation();
        form.handleSubmit();
      }}
    >
      <form.Field name="title">
        {field => {
          // An empty field isn't an error worth showing; submitting it is just a no-op.
          const errorMessage = field.state.value ? fieldError(field.state.meta) : undefined;
          return (
            <Input
              value={field.state.value}
              invalid={!!errorMessage}
              disabled={isHidden}
              errorMessage={errorMessage}
              onChange={evt => field.handleChange(evt.target.value)}
              placeholder="Add Task"
            />
          );
        }}
      </form.Field>
    </Container>
  );
};

export default AddTask;
