import loadable from "@loadable/component";

import { Modal } from "./UserSettingsModal.styles";

import { Loader } from "@components/Modal";
import useEditListModal from "@hooks/useEditListModal";

const Content = loadable(() => import("./Content"), {
  fallback: <Loader />
}) as React.ComponentType<Record<string, never>>;

interface Props {
  isOpen: boolean;
}

function EditListModalContainer({ isOpen }: Props) {
  const { closeModal } = useEditListModal();
  return (
    <Modal onRequestClose={closeModal} visible={isOpen}>
      {isOpen && <Content />}
    </Modal>
  );
}

export default EditListModalContainer;
