import { lazy, Suspense } from "react";
import { Modal } from "./UserSettingsModal.styles";
import { Loader } from "@components/Modal";
import useEditListModal from "@hooks/useEditListModal";

const Content = lazy(() => import("./Content"));

interface Props {
  isOpen: boolean;
}

function EditListModalContainer({ isOpen }: Props) {
  const { closeModal } = useEditListModal();
  return (
    <Modal onRequestClose={closeModal} visible={isOpen}>
      {isOpen && (
        <Suspense fallback={<Loader />}>
          <Content />
        </Suspense>
      )}
    </Modal>
  );
}

export default EditListModalContainer;
