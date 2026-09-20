import { useEffect, useCallback, useState, useRef } from "react";

import { Container, Content, Block, ButtonContainer, HeaderBar, HeaderTitle } from "./EditTask.styles";
import CreatorBlock from "./CreatorBlock";
import ListsDropdown from "./ListsDropdown";
import Loader from "./Loader";

import Task from "@customTypes/task";
import Selector from "@components/Selector";
import { Label, Input, Error } from "@components/Forms";
import Button from "@components/Button";
import DueDate from "@components/DueDate/DueDate";
import Subtasks from "@components/Subtasks";
import useCurrentTaskId from "@hooks/useCurrentTaskId";
import useTaskDetails from "@hooks/useTaskDetails";
import useModifyTask from "@hooks/useModifyTask";
import useDeleteTask from "@hooks/useDeleteTask";
import { ServerError } from "@utilities/server";
import RichTextEditor from "@components/Forms/RichText";

const PRIORITIES = [
  { value: "low", label: "Low" },
  { value: "normal", label: "Normal" },
  { value: "high", label: "High" }
];

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

  useEffect(() => {
    _setState({ ...(task || {}), priority: task?.priority ?? "normal" });
  }, [task]);

  // Mirror the latest state + dirty flag in refs so `flush` (called from the
  // container on close) can read current values without stale closures.
  const stateRef = useRef(state);
  stateRef.current = state;
  const isDirty = useRef(false);
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

  const _setValues = (updatedProps: Partial<Task>) => {
    _setState(state => ({
      ...state,
      ...updatedProps
    }));
  };

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
    <Container onSubmit={onSubmit}>
      <Content>
        <HeaderBar>
          <HeaderTitle>Edit Task</HeaderTitle>
        </HeaderBar>
        {_error && <Error>{_error}</Error>}
        <Block>
          <Label>Title</Label>
          <Input value={state.title} onChange={onInputChange("title")} />
        </Block>
        <Block>
          <Label>Priority</Label>
          <Selector
            values={PRIORITIES}
            onSelect={(priority: Task["priority"]) => onValueChange({ priority })}
            value={state.priority}
          />
        </Block>
        <Block>
          <Label>Subtasks</Label>
          <Subtasks
            subtasks={state.subtasks || []}
            onChange={subtasks => {
              onValueChange({ subtasks });
              onSaveTask({ subtasks });
            }}
          />
        </Block>
        <Block>
          <Label>Notes</Label>
          <RichTextEditor content={state.notes} onChange={onNotesChange} onBlur={onNotesBlur} />
        </Block>
        <Block>
          <Label>List</Label>
          <ListsDropdown onSelect={listId => onValueChange({ listId })} currentListId={state.listId} />
        </Block>
        <Block>
          <Label>Due By</Label>
          <DueDate value={state.dueDate} onChange={dueDate => onValueChange({ dueDate })} />
        </Block>
        {task && <CreatorBlock createdBy={task.createdBy} creationDate={task.creationDate} />}
      </Content>
      <ButtonContainer>
        <Button type="submit" isLoading={isSaving} loadingText="Saving">
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
