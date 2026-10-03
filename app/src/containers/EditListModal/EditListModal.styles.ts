import { styled } from "@linaria/react";

import { theme } from "../../theme";

import _Modal from "@components/Modal";

export const Modal = styled(_Modal)`
  position: absolute;
  top: 4rem;
  right: 0;
  left: auto;
  opacity: 0;
  width: 100%;
  border-radius: 1.25rem;
  padding: 1rem;
  background: ${theme.effects.glassBackground};
  backdrop-filter: blur(40px) saturate(1.8);
  -webkit-backdrop-filter: blur(40px) saturate(1.8);
  box-shadow:
    0 8px 32px rgba(0, 0, 0, 0.18),
    inset 0 0 0 1px ${theme.effects.glassHighlight},
    inset 0 1px 0 ${theme.effects.glassHighlightTop};
  & [data-betterdo-modal-arrow] {
    display: none;
  }
  ${theme.queries.medium} {
    right: 10px;
    & [data-betterdo-modal-arrow] {
      display: block;
      top: -0.5rem;
      right: 1.2rem;
      left: auto;
      height: 1.2rem;
      width: 1.2rem;
      border-radius: 3px 0 0 0;
      transform: rotate(45deg);
      background: ${theme.colors.modals.contentBackground};
      border-left: 1px solid ${theme.colors.modals.contentBackground};
      border-top: 1px solid ${theme.colors.modals.contentBackground};
      box-shadow:
        -1px -1px 0 rgba(255, 255, 255, 0.15),
        -2px -2px 0 rgba(0, 0, 0, 0.6);
    }
  }
`;
