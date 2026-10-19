import { useEffect, useCallback, useState, useRef, useId } from "react";
import type { CSSProperties } from "react";

import { Container, Content, ButtonContainer, HeaderBar, HeaderTitle } from "./EditTask.styles";
import CreatorBlock from "./CreatorBlock";
import ListsDropdown from "./ListsDropdown";
import Loader from "./Loader";

import { PRIORITY_OPTIONS } from "@betterdo/shared/constants";

import Task from "@customTypes/task";
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
import RichTextEditor from "@components/Forms/RichText";

interface Props {
  setUnsavedChanges: (bool: boolean) => void;
  registerFlush?: (flush: (() => Promise<void>) | null) => void;
}

function EditTaskContent({ setUnsavedChanges, registerFlush }: Props) {
  const taskId = useCurrentTaskId() || "";
  const { task, loading, error } = useTaskDetails(taskId);
  const modifyTask = useModifyTask();
  const deleteTask = useDeleteTask();
  const [state, _setState] = useState<Partial<Task>>({ ...(task || {}), priority: task?.priority ?? "normal" });
  const [_error, setError] = useState<string | undefined>();
  const [isSaving, setSaving] = useState(false);
  const [isDeleting, setDeleting] = useState(false);

  // Accent the modal with the color of the list the task belongs to. Reading
  // `state.listId` (not `task.listId`) previews the new list's color as soon as
  // a different list is picked in the dropdown. The palette is contrast-checked
  // for the active theme, so any user-picked color stays WCAG compliant.
  const { lists } = useLists();
  const listColor = lists.find(list => list.id === state.listId)?.color;
  const { accent, accentText, onAccent } = useAccentPalette(listColor);
  const accentStyle = {
    "--accent-color": accent,
    "--accent-text-color": accentText,
    "--on-accent-color": onAccent
  } as CSSProperties;

  const idPrefix = useId();
  const ids = {
    form: `${idPrefix}-form`,
    title: `${idPrefix}-title`,
    priority: `${idPrefix}-priority`,
    list: `${idPrefix}-list`,
    dueDate: `${idPrefix}-due-date`
  };

  const isDirty = useRef(false);

  useEffect(() => {
    // Only sync local state from the server when there are no unsaved changes.
    if (isDirty.current) {
      return;
    }
    _setState({ ...(task || {}), priority: task?.priority ?? "normal" });
  }, [task]);

  // Mirror the latest state + dirty flag in refs so `flush` (called from the
  // container on close) can read current values without stale closures.
  const stateRef = useRef(state);
  stateRef.current = state;
  const markDirty = useCallback(
    (dirty: boolean) => {
      isDirty.current = dirty;
      setUnsavedChanges(dirty);
    },
    [setUnsavedChanges]
  );

  const onSaveTask = useCallback(
    async (updatedProps: Partial<Task>) => {
      if (!stateRef.current.listId) {
        return;
      }
      setSaving(true);
      try {
        await modifyTask(taskId, stateRef.current.listId, updatedProps);
        markDirty(false);
      } catch (err) {
        console.error(err);
        setError(err instanceof ServerError ? err.formattedMessage : ServerError.defaultError);
      } finally {
        setSaving(false);
      }
    },
    [modifyTask, markDirty, taskId]
  );

  // Persist any unsaved edits on close (notes save on blur, but closing via the
  // X/overlay can race that blur). Saves all editable fields when dirty.
  useEffect(() => {
    if (!registerFlush) {
      return;
    }
    registerFlush(async () => {
      if (!isDirty.current) {
        return;
      }
      const s = stateRef.current;
      await onSaveTask({
        title: s.title,
        priority: s.priority,
        dueDate: s.dueDate,
        notes: s.notes,
        subtasks: s.subtasks,
        ...(task && s.listId !== task.listId ? { listId: s.listId } : {})
      });
    });
    return () => registerFlush(null);
  }, [registerFlush, onSaveTask, task]);

  const onSubmit = useCallback(
    (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      if (task) {
        onSaveTask({
          title: state.title,
          priority: state.priority,
          dueDate: state.dueDate,
          notes: state.notes,
          subtasks: state.subtasks,
          // we only mutate list if changed, or else we automatically
          // redirect which isn't ideal (custom lists)
          ...(state.listId !== task.listId ? { listId: state.listId } : {})
        });
      }
    },
    [state, task, onSaveTask]
  );

  const onDeleteTask = useCallback(async () => {
    const result = confirm(`Are you sure you want to delete the task "${state.title}"? This can't be undone.`);
    if (result) {
      setDeleting(true);
      try {
        await deleteTask(taskId);
      } catch (err) {
        console.error(err);
        if (err instanceof ServerError) {
          setError(err.formattedMessage);
        } else {
          setError(ServerError.defaultError);
        }
        setSaving(false);
      }
      setDeleting(false);
    }
  }, [taskId, deleteTask, state.title]);

  const _setValues = (updatedProps: Partial<Task>) => {
    _setState(state => ({
      ...state,
      ...updatedProps
    }));
  };

  const onInputChange = (id: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    // Mark content as dirty
    markDirty(true);
    // Set state for re-render
    _setValues({ [id]: e.target.value });
  };

  const onValueChange = useCallback(
    (updatedProps: Partial<Task>) => {
      markDirty(true);
      _setValues(updatedProps);
    },
    [markDirty]
  );

  // Notes update local state live (marking the form dirty) and persist when the
  // editor loses focus. Saving on blur keeps the save logic simple (no debounce
  // timers or flush bookkeeping) while still autosaving without a button press.
  const onNotesChange = useCallback(
    (notes: string) => {
      onValueChange({ notes });
    },
    [onValueChange]
  );

  const onNotesBlur = useCallback(
    (notes: string) => {
      onSaveTask({ notes });
    },
    [onSaveTask]
  );

  if (loading || !state.id) {
    return <Loader />;
  }

  if (error) {
    return <Error>Unexpected Error</Error>;
  }

  return (
    <Container style={accentStyle}>
      <Content>
        <HeaderBar>
          <HeaderTitle>Edit Task</HeaderTitle>
        </HeaderBar>
        <Form id={ids.form} onSubmit={onSubmit} errorMessage={_error}>
          <Field>
            <Label htmlFor={ids.title}>Title</Label>
            <Input id={ids.title} value={state.title} onChange={onInputChange("title")} />
          </Field>
          <Field>
            <Label id={ids.priority}>Priority</Label>
            <Selector
              aria-labelledby={ids.priority}
              values={PRIORITY_OPTIONS}
              onSelect={(priority: Task["priority"]) => onValueChange({ priority })}
              value={state.priority}
            />
          </Field>
          <Field>
            <Label>Subtasks</Label>
            <Subtasks
              subtasks={state.subtasks || []}
              onChange={subtasks => {
                onValueChange({ subtasks });
                onSaveTask({ subtasks });
              }}
            />
          </Field>
          <Field>
            <Label>Notes</Label>
            <RichTextEditor content={state.notes} onChange={onNotesChange} onBlur={onNotesBlur} />
          </Field>
          <Field>
            <Label htmlFor={ids.list}>List</Label>
            <ListsDropdown id={ids.list} onSelect={listId => onValueChange({ listId })} currentListId={state.listId} />
          </Field>
          <Field>
            <Label id={ids.dueDate}>Due By</Label>
            <DueDate
              aria-labelledby={ids.dueDate}
              value={state.dueDate}
              onChange={dueDate => onValueChange({ dueDate })}
            />
          </Field>
          {task && <CreatorBlock createdBy={task.createdBy} creationDate={task.creationDate} />}
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
