import { lazy, Suspense, useCallback } from "react";
import { arrayMoveImmutable } from "array-move";
import { LayoutGroup, AnimatePresence } from "framer-motion";
import { Container, TaskContainer, Scroller } from "./Body.styles";
import CompletedTasksButton from "./CompletedTasksButton";
import { ServerErrorBanner } from "./Banners";
import customLists from "@utilities/customLists";
import AddTask from "@components/AddTask";
import Task from "@components/Task";
import useListDetails from "@hooks/useListDetails";
import useCurrentListId from "@hooks/useCurrentListId";
import useModifyList from "@hooks/useModifyList";
import useCompletedTasks from "@hooks/useCompletedTasks";

const NotificationBanner = lazy(() => import("./NotificationBanner"));

const SortableList = lazy(() => import("./SortableList"));

const AllCaughtUpBanner = lazy(() => import("./AllCaughtUp"));

function Body() {
  const currentListId = useCurrentListId();
  const { list, loading, error } = useListDetails(currentListId);
  const [isCompletedTasksIncluded, setIncludeCompletedTasks] = useCompletedTasks();
  const modifyList = useModifyList();

  const onSortEnd = useCallback(
    ({ oldIndex, newIndex }: { oldIndex: number; newIndex: number }) => {
      // Indexes match, no change
      if (oldIndex === newIndex) {
        return;
      }
      try {
        modifyList(currentListId, {
          tasks: arrayMoveImmutable(list.tasks || [], oldIndex, newIndex)
        });
      } catch (err) {
        console.error(err);
      }
    },
    [list, currentListId, modifyList]
  );

  const isAllCaughtUp = Boolean(
    !error && !loading && list.tasks && list.tasks.length === 0 && !isCompletedTasksIncluded
  );

  const customListConfig = customLists.find(cl => list.id === cl.id);
  const hideAddTaskInput = error || (customListConfig && customListConfig.disableTaskCreation);

  return (
    <Container>
      <Suspense>
        <NotificationBanner />
      </Suspense>
      <Scroller>
        <AddTask isAbsolute={isAllCaughtUp} isHidden={hideAddTaskInput} />
        {!error && (
          <LayoutGroup>
            <TaskContainer>
              {/* Regular non-complete tasks are loaded and sortable  */}
              <Suspense>
                <SortableList listId={list.id || currentListId} tasks={list.tasks || []} onSortEnd={onSortEnd} />
              </Suspense>
              {/* Completed tasks are not sortable and only shown when requested */}
              {isCompletedTasksIncluded &&
                list?.completedTasks?.map(task => <Task key={task.id} {...task} isCompleted={true} />)}
              {/* If not loaded, show completed tasks button */}
              <CompletedTasksButton
                isAllCaughtUp={isAllCaughtUp}
                hidden={(loading && !isCompletedTasksIncluded) || error || list.additionalTasks === 0}
                count={list.additionalTasks}
                isLoading={loading && isCompletedTasksIncluded}
                onClick={() => setIncludeCompletedTasks(true)}
              />
            </TaskContainer>
          </LayoutGroup>
        )}
        <AnimatePresence initial={false}>
          {isAllCaughtUp && (
            <Suspense>
              <AllCaughtUpBanner />
            </Suspense>
          )}
        </AnimatePresence>
        {error && <ServerErrorBanner />}
      </Scroller>
    </Container>
  );
}

export default Body;
