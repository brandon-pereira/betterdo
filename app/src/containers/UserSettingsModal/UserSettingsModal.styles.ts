import { styled } from "styled-components";

import _Modal from "@components/Modal";

export const Modal = styled(_Modal)`
  /* 460 is to make all tabs fit nicely */
  min-width: min(100%, 460px);
  padding: 1rem;
  border-radius: 1.25rem;
  background: ${({ theme }) => (theme.isDarkMode ? "rgba(30, 30, 30, 0.7)" : "#fff")};
  backdrop-filter: blur(40px) saturate(1.8);
  -webkit-backdrop-filter: blur(40px) saturate(1.8);
  box-shadow:
    0 8px 32px rgba(0, 0, 0, 0.18),
    inset 0 0 0 1px ${({ theme }) => (theme.isDarkMode ? "rgba(255, 255, 255, 0.08)" : "rgba(255, 255, 255, 0.6)")},
    inset 0 1px 0 ${({ theme }) => (theme.isDarkMode ? "rgba(255, 255, 255, 0.05)" : "rgba(255, 255, 255, 0.8)")};
  & [data-betterdo-modal-arrow] {
    display: none;
  }
`;
