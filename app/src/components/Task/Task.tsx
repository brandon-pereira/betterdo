import { forwardRef, useCallback } from "react";

import { Container, Checkbox, Title, HighPriorityFlag, Loader } from "./Task.styles";

import TaskType from "@customTypes/task";
import useEditTaskModal from "@hooks/useEditTaskModal";
import useModifyTask from "@hooks/useModifyTask";

interface Props extends TaskType {
  containerProps?: React.ButtonHTMLAttributes<HTMLButtonElement>;
  touchEvents?: import("@dnd-kit/core").DraggableSyntheticListeners;
}

const Task = forwardRef<HTMLButtonElement, Props>(
  ({ title, id, isCompleted, listId, isLoading, priority, containerProps, touchEvents }, ref) => {
    const { openTaskModal } = useEditTaskModal();
    const modifyTask = useModifyTask();

    const onEditTask = useCallback(() => {
      openTaskModal(id);
    }, [openTaskModal, id]);

    const onToggleTaskCompletion = useCallback(() => {
      modifyTask(id, listId, {
        isCompleted: !isCompleted
      });
    }, [id, modifyTask, isCompleted, listId]);

    return (
      <Container ref={ref} $isLoading={isLoading} onClick={onEditTask} $priority={priority} {...containerProps}>
        {isLoading ? (
          <Loader color="#202020" size="1.7rem" isVisible={true} />
        ) : (
          <Checkbox
            type="checkbox"
            aria-label={`Mark ${title} ${isCompleted ? "incomplete" : "complete"}`}
            onClick={e => e.stopPropagation()}
            onChange={onToggleTaskCompletion}
            checked={isCompleted}
            {...touchEvents}
          />
        )}
        <Title>{title}</Title>
        {priority === "high" && <HighPriorityFlag />}
      </Container>
    );
  }
);

Task.displayName = "Task";

export default Task;
