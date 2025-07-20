import { lazy, Suspense, useCallback, useRef } from "react";
import { Modal } from "./EditListModal.styles";
import { Loader } from "@components/Modal";
import useEditListModal from "@hooks/useEditListModal";

const Content = lazy(() => import("./content"));

interface Props {
  isOpen: boolean;
}

const variants = {
  hidden: {
    opacity: 0,
    y: -100
  },
  visible: {
    opacity: 1,
    y: 0
  }
};

function EditListModalContainer({ isOpen }: Props) {
  const hasUnsavedChanges = useRef<boolean>(false);
  const { closeModal } = useEditListModal();
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
  const onClose = useCallback(() => {
    if (canCloseModal()) {
      closeModal();
      hasUnsavedChanges.current = false;
    }
  }, [canCloseModal, closeModal]);

  return (
    <Modal canCloseModal={canCloseModal} onRequestClose={closeModal} visible={isOpen} variants={variants}>
      {isOpen && (
        <Suspense fallback={<Loader />}>
          <Content setUnsavedChanges={setUnsavedChanges} onRequestClose={onClose} />
        </Suspense>
      )}
    </Modal>
  );
}

export default EditListModalContainer;
