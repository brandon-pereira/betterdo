import { lazy, useCallback, useEffect, useRef, useLayoutEffect, Suspense } from "react";
import { MEDIUM } from "../../constants";
import { Modal } from "./AddListModal.styles";
import { Loader } from "@components/Modal";
import useNewListModal from "@hooks/useNewListModal";

const Content = lazy(() => import("./Content"));

interface Props {
  isOpen: boolean;
}

const variants = {
  hidden: {
    opacity: 0,
    x: -100
  },
  visible: {
    opacity: 1,
    x: 0
  }
};

function AddListModalContainer({ isOpen }: Props) {
  const modalRef = useRef<HTMLDivElement>(null);
  const { closeModal } = useNewListModal();

  const calculatePosition = useCallback(() => {
    const $modal = modalRef.current;
    const $newList = document.querySelector("[data-betterdo-newlist]") as HTMLDivElement;
    const $arrow = modalRef.current?.querySelector("[data-betterdo-modal-arrow]") as HTMLDivElement;
    if (!$modal || !$newList || !$arrow) {
      return;
    }
    // Only position properties are set, so framer-motion's inline transform and
    // opacity (the enter/exit animation) are left alone.
    if (window.innerWidth >= MEDIUM) {
      const nlCords = $newList.getBoundingClientRect();
      Object.assign($modal.style, { top: nlCords.top + "px", left: nlCords.width + 10 + "px", bottom: "auto" });
      const mCords = $modal.getBoundingClientRect();
      const isBottom = mCords.top + mCords.height >= window.innerHeight;
      $arrow.removeAttribute("style");
      if (isBottom) {
        Object.assign($modal.style, { top: "auto", bottom: "0" });
        Object.assign($arrow.style, {
          top: "auto",
          bottom: window.innerHeight - (nlCords.height + nlCords.top) + 10 + "px"
        });
      }
    } else {
      $arrow.removeAttribute("style");
      Object.assign($modal.style, { top: "", left: "", bottom: "" });
      $newList.removeAttribute("style");
    }
  }, []);

  useLayoutEffect(() => {
    if (isOpen && modalRef.current) {
      calculatePosition();
    }
  }, [isOpen, calculatePosition]);

  useEffect(() => {
    if (isOpen && modalRef.current) {
      window.addEventListener("resize", calculatePosition);
      return () => window.removeEventListener("resize", calculatePosition);
    }
  }, [isOpen, calculatePosition]);

  return (
    <Modal
      disableHeightAnimation={true}
      ref={modalRef}
      onRequestClose={closeModal}
      visible={isOpen}
      onAnimationComplete={calculatePosition}
      variants={variants}
    >
      {isOpen && (
        <Suspense fallback={<Loader />}>
          <Content onLoad={calculatePosition} />
        </Suspense>
      )}
    </Modal>
  );
}

export default AddListModalContainer;
