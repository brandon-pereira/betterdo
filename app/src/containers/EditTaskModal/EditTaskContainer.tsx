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
    x: "100%"
  },
  visible: {
    x: 0
  }
};

function EditTaskContainer({ isOpen }: Props) {
  const hasUnsavedChanges = useRef(false);
  const { closeModal } = useEditTaskModal();
  const setUnsavedChanges = useCallback((bool: boolean) => {
    hasUnsavedChanges.current = bool;
  }, []);

  const canCloseModal = useCallback(() => {
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
    >
      {isOpen && (
        <Suspense fallback={<Loader />}>
          <Content setUnsavedChanges={setUnsavedChanges} />
        </Suspense>
      )}
    </Modal>
  );
}

export default EditTaskContainer;
