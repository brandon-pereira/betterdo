import { styled } from "@linaria/react";
import { motion } from "framer-motion";
import _FocusLock from "react-focus-lock";

import { theme } from "../../theme";

import Icon from "@components/Icon";

export const Overlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  /* Above all app chrome (title bar, header, logo, nav). */
  z-index: var(--z-modal-overlay);
  background: ${theme.colors.modals.overlayBackground};
  backdrop-filter: blur(3px);
  &[data-visible="false"] {
    visibility: hidden;
    pointer-events: none;
  }
`;

export const FocusLock = styled(_FocusLock)`
  display: flex;
  align-content: center;
  justify-content: center;
  width: 100%;
  pointer-events: none;
`;
export const Container = styled(motion.div)`
  pointer-events: all;
  background: ${theme.colors.modals.contentBackground};
  box-shadow: 0 3px 5px rgba(0, 0, 0, 0.5);
  position: relative;
  visibility: hidden;
  backface-visibility: hidden;
  max-width: min(500px, 100%);
  box-sizing: border-box;
  &[data-visible="true"] {
    visibility: visible;
  }
  ${theme.queries.medium} {
    width: 60%;
  }
`;

export const ContentContainer = styled.div<{
  $height: number | "auto";
  $disableHeightAnimation?: boolean;
}>`
  overflow: hidden;
  height: ${props => {
    if (props.$disableHeightAnimation) {
      return "100%";
    }
    return typeof props.$height === "number" && props.$height !== 0 ? `${props.$height}px` : `auto`;
  }};
  transition: height 0.1s;
`;

export const LoaderContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 15rem;
`;
export const ModalClose = styled(Icon)`
  position: absolute;
  top: 1rem;
  right: 1rem;
  z-index: 3;
  filter: drop-shadow(0 1px #555);
`;

export const Content = styled.div`
  position: relative;
  z-index: 2;
  padding: 1rem;
  max-height: 100vh;
  width: 100%;
  box-sizing: border-box;
  overflow: auto;
  &[data-full-height="true"] {
    height: 100%;
  }
`;

export const Arrow = styled.div`
  height: 1.2rem;
  width: 1.2rem;
  position: absolute;
  z-index: 1;
  top: 1rem;
  left: -0.6rem;
  transform: rotate(45deg);
  background: ${theme.colors.modals.contentBackground};
`;
