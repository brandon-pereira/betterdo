import { useRef, useCallback, lazy, Suspense } from "react";
import { Modal } from "./EditTask.styles";
import Loader from "./Loader";
import useEditTaskModal from "@hooks/useEditTaskModal";

const Content = lazy(() => import("./EditTaskContent"));

interface Props {
  isOpen: boolean;
}

const variants = {
  hidden: {
    x: "105%",
    opacity: 0.8
  },
  visible: {
    x: 0,
    opacity: 1
  }
};

const transition = {
  type: "spring" as const,
  damping: 30,
  stiffness: 350
  // mass: 0.5
};

function EditTaskContainer({ isOpen }: Props) {
  const hasUnsavedChanges = useRef(false);
  // The content registers a "flush" that persists any unsaved edits (e.g. notes
  // that haven't blurred yet) and resolves once the save settles. We call it on
  // close so pending edits are saved instead of prompting to discard them.
  const flushPendingSave = useRef<(() => Promise<void>) | null>(null);
  const { closeModal } = useEditTaskModal();
  const setUnsavedChanges = useCallback((bool: boolean) => {
    hasUnsavedChanges.current = bool;
  }, []);
  const registerFlush = useCallback((flush: (() => Promise<void>) | null) => {
    flushPendingSave.current = flush;
  }, []);

  const canCloseModal = useCallback(async () => {
    // Flush any unsaved edits before deciding. Notes save on blur, but closing
    // via the X/overlay can race that blur, so we explicitly persist here.
    // After a successful flush there are no unsaved changes and we close
    // cleanly without an unnecessary confirm dialog.
    if (flushPendingSave.current) {
      try {
        await flushPendingSave.current();
      } catch {
        // If the save failed, fall through to the unsaved-changes check below.
      }
    }

    if (!hasUnsavedChanges.current) {
      return true;
    } else {
      const status = Boolean(confirm(`You've made changes that aren't saved. Are you sure you want to discard them?`));
      if (status) {
        setUnsavedChanges(false);
      }
      return status;
    }
  }, [hasUnsavedChanges, setUnsavedChanges]);

  // TODO: Is this function needed?
  // const onClose = useCallback(() => {
  //     if (canCloseModal()) {
  //         closeModal();
  //         hasUnsavedChanges.current = false;
  //     }
  // }, [canCloseModal, closeModal]);

  return (
    <Modal
      disableHeightAnimation={true}
      canCloseModal={canCloseModal}
      onRequestClose={closeModal}
      visible={isOpen}
      variants={variants}
      transition={transition}
    >
      {isOpen && (
        <Suspense fallback={<Loader />}>
          <Content setUnsavedChanges={setUnsavedChanges} registerFlush={registerFlush} />
        </Suspense>
      )}
    </Modal>
  );
}

export default EditTaskContainer;
