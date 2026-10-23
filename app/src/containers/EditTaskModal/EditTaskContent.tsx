import { useEffect, useCallback, useState, useRef, useId } from "react";
import type { CSSProperties } from "react";
import { useForm, useSelector } from "@tanstack/react-form";

import { Container, Content, ButtonContainer, HeaderBar, HeaderTitle } from "./EditTask.styles";
import CreatorBlock from "./CreatorBlock";
import ListsDropdown from "./ListsDropdown";
import Loader from "./Loader";

import { PRIORITY_OPTIONS } from "@betterdo/shared/constants";

import type Task from "@customTypes/task";
import Selector from "@components/Selector";
import { Form, Field, Label, Input, Error } from "@components/Forms";
import Button from "@components/Button";
import DueDate from "@components/DueDate/DueDate";
import Subtasks from "@components/Subtasks";
import useCurrentTaskId from "@hooks/useCurrentTaskId";
import useTaskDetails from "@hooks/useTaskDetails";
import useModifyTask from "@hooks/useModifyTask";
import useDeleteTask from "@hooks/useDeleteTask";
import useLists from "@hooks/useLists";
import useAccentPalette from "@hooks/useAccentPalette";
import { ServerError } from "@utilities/server";
import { fieldError } from "@utilities/forms";
import { editTaskSchema } from "@utilities/validation/task";
import type { EditTaskValues } from "@utilities/validation/task";
import RichTextEditor from "@components/Forms/RichText";

interface Props {
  setUnsavedChanges: (bool: boolean) => void;
  registerFlush?: (flush: (() => Promise<void>) | null) => void;
}

const toFormValues = (task?: Task): EditTaskValues => ({
  title: task?.title ?? "",
  priority: task?.priority ?? "normal",
  listId: task?.listId ?? "",
  // Normalize nullable server values so form fields get consistent types.
  dueDate: task?.dueDate ?? undefined,
  notes: task?.notes ?? "",
  subtasks: task?.subtasks ?? []
});

function EditTaskContent({ setUnsavedChanges, registerFlush }: Props) {
  const taskId = useCurrentTaskId() || "";
  const { task, loading, error } = useTaskDetails(taskId);
  const modifyTask = useModifyTask();
  const deleteTask = useDeleteTask();
  const [_error, setError] = useState<string | undefined>();
  const [isSaving, setSaving] = useState(false);
  const [isDeleting, setDeleting] = useState(false);

  const idPrefix = useId();
  const ids = {
    form: `${idPrefix}-form`,
    title: `${idPrefix}-title`,
    priority: `${idPrefix}-priority`,
    list: `${idPrefix}-list`,
    dueDate: `${idPrefix}-due-date`,
    dueDateCustom: `${idPrefix}-due-date-custom`
  };

  // Tracks edits that haven't been fully persisted yet. Kept separately from the
  // form's own `isDirty` (which never resets on save) so the container can
  // decide whether closing needs to flush/confirm.
  const isDirty = useRef(false);
  const markDirty = useCallback(
    (dirty: boolean) => {
      isDirty.current = dirty;
      setUnsavedChanges(dirty);
    },
    [setUnsavedChanges]
  );

  const saveTask = useCallback(
    async (listId: string, updatedProps: Partial<Task>) => {
      if (!listId) {
        return false;
      }
      setSaving(true);
      try {
        await modifyTask(taskId, listId, updatedProps);
        return true;
      } catch (err) {
        console.error(err);
        setError(err instanceof ServerError ? err.formattedMessage : ServerError.defaultError);
        return false;
      } finally {
        setSaving(false);
      }
    },
    [modifyTask, taskId]
  );

  const form = useForm({
    defaultValues: toFormValues(task),
    validators: { onChange: editTaskSchema },
    onSubmit: async ({ value }) => {
      if (!task) {
        return;
      }
      setError(undefined);
      const saved = await saveTask(value.listId, {
        title: value.title,
        priority: value.priority,
        dueDate: value.dueDate,
        notes: value.notes,
        subtasks: value.subtasks,
        // Only send `listId` when it changed, or else modifyTask redirects,
        // which isn't ideal from custom lists.
        ...(value.listId !== task.listId ? { listId: value.listId } : {})
      });
      if (saved) {
        markDirty(false);
      }
    }
  });

  // Accent the modal with the color of the list the task belongs to. Reading the
  // form's `listId` (not `task.listId`) previews the new list's color as soon as
  // a different list is picked in the dropdown. The palette is contrast-checked
  // for the active theme, so any user-picked color stays WCAG compliant.
  const { lists } = useLists();
  const selectedListId = useSelector(form.store, state => state.values.listId);
  const listColor = lists.find(list => list.id === selectedListId)?.color;
  const { accent, accentText, onAccent } = useAccentPalette(listColor);
  const accentStyle = {
    "--accent-color": accent,
    "--accent-text-color": accentText,
    "--on-accent-color": onAccent
  } as CSSProperties;

  // Re-seed the form from the server, but only when there are no unsaved changes.
  useEffect(() => {
    if (isDirty.current) {
      return;
    }
    form.reset(toFormValues(task));
  }, [task, form]);

  // Persist any unsaved edits on close (notes save on blur, but closing via the
  // X/overlay can race that blur). Submits the whole form when dirty; if it's
  // invalid nothing is saved, it stays dirty, and the container asks to discard.
  useEffect(() => {
    if (!registerFlush) {
      return;
    }
    registerFlush(async () => {
      if (isDirty.current) {
        await form.handleSubmit();
      }
    });
    return () => registerFlush(null);
  }, [registerFlush, form]);

  const onDeleteTask = useCallback(async () => {
    const result = confirm(
      `Are you sure you want to delete the task "${form.state.values.title}"? This can't be undone.`
    );
    if (result) {
      setDeleting(true);
      try {
        await deleteTask(taskId);
      } catch (err) {
        console.error(err);
        setError(err instanceof ServerError ? err.formattedMessage : ServerError.defaultError);
      }
      setDeleting(false);
    }
  }, [taskId, deleteTask, form]);

  if (error) {
    return <Error>Unexpected Error</Error>;
  }

  if (loading || !task) {
    return <Loader />;
  }

  return (
    <Container style={accentStyle}>
      <Content>
        <HeaderBar>
          <HeaderTitle>Edit Task</HeaderTitle>
        </HeaderBar>
        <Form
          id={ids.form}
          errorMessage={_error}
          onSubmit={e => {
            e.preventDefault();
            e.stopPropagation();
            form.handleSubmit();
          }}
        >
          <Field>
            <Label htmlFor={ids.title}>Title</Label>
            <form.Field name="title">
              {field => {
                const errorMessage = fieldError(field.state.meta);
                return (
                  <Input
                    id={ids.title}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={evt => {
                      markDirty(true);
                      field.handleChange(evt.target.value);
                    }}
                    invalid={!!errorMessage}
                    errorMessage={errorMessage}
                  />
                );
              }}
            </form.Field>
          </Field>
          <Field>
            <Label id={ids.priority}>Priority</Label>
            <form.Field name="priority">
              {field => (
                <Selector
                  aria-labelledby={ids.priority}
                  values={PRIORITY_OPTIONS}
                  onSelect={(priority: Task["priority"]) => {
                    markDirty(true);
                    field.handleChange(priority);
                  }}
                  value={field.state.value}
                />
              )}
            </form.Field>
          </Field>
          <Field>
            <Label>Subtasks</Label>
            <form.Field name="subtasks">
              {field => (
                <Subtasks
                  subtasks={field.state.value}
                  onChange={subtasks => {
                    field.handleChange(subtasks);
                    // Subtasks persist immediately.
                    saveTask(form.state.values.listId, { subtasks });
                  }}
                />
              )}
            </form.Field>
          </Field>
          <Field>
            <Label>Notes</Label>
            <form.Field name="notes">
              {field => (
                <RichTextEditor
                  content={field.state.value}
                  onChange={notes => {
                    markDirty(true);
                    field.handleChange(notes);
                  }}
                  // Notes autosave when the editor loses focus.
                  onBlur={notes => {
                    field.handleBlur();
                    saveTask(form.state.values.listId, { notes });
                  }}
                  // Checking or reordering checklist items persists immediately.
                  onCommit={notes => saveTask(form.state.values.listId, { notes })}
                />
              )}
            </form.Field>
          </Field>
          <Field>
            <Label htmlFor={ids.list}>List</Label>
            <form.Field name="listId">
              {field => (
                <ListsDropdown
                  id={ids.list}
                  onSelect={listId => {
                    markDirty(true);
                    field.handleChange(listId);
                  }}
                  currentListId={field.state.value}
                />
              )}
            </form.Field>
          </Field>
          <Field>
            {/* Clicking the label activates the Custom button, opening the date picker. */}
            <Label id={ids.dueDate} htmlFor={ids.dueDateCustom}>
              Due By
            </Label>
            <form.Field name="dueDate">
              {field => (
                <DueDate
                  htmlFor={ids.dueDateCustom}
                  aria-labelledby={ids.dueDate}
                  value={field.state.value}
                  onChange={dueDate => {
                    markDirty(true);
                    field.handleChange(dueDate);
                  }}
                />
              )}
            </form.Field>
          </Field>
          <CreatorBlock createdBy={task.createdBy} creationDate={task.creationDate} />
        </Form>
      </Content>
      <ButtonContainer>
        {/* The footer sits outside the scrolling form, so associate the submit button via `form`. */}
        <Button
          type="submit"
          form={ids.form}
          color={accent}
          style={
            { "--text-color": onAccent, "--hover-tint": onAccent === "#ffffff" ? "#000" : "#fff" } as CSSProperties
          }
          loaderColor={onAccent}
          isLoading={isSaving}
          loadingText="Saving"
        >
          Save
        </Button>
        <Button type="button" color={"red"} onClick={onDeleteTask} isLoading={isDeleting} loadingText="Deleting">
          Delete
        </Button>
      </ButtonContainer>
    </Container>
  );
}

export default EditTaskContent;
