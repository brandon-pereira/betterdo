import { styled } from "@linaria/react";

import { theme } from "../../theme";

import _Modal from "@components/Modal";

export const Modal = styled(_Modal)`
  padding: 1rem;
  border-radius: 1.25rem;
  background: ${theme.effects.glassBackground};
  backdrop-filter: blur(40px) saturate(1.8);
  -webkit-backdrop-filter: blur(40px) saturate(1.8);
  box-shadow:
    0 8px 32px rgba(0, 0, 0, 0.18),
    inset 0 0 0 1px ${theme.effects.glassHighlight},
    inset 0 1px 0 ${theme.effects.glassHighlightTop};
  [data-betterdo-modal-arrow] {
    display: none;
  }
  ${theme.queries.medium} {
    position: absolute;
    transform: translateX(-50px);
    opacity: 0;
    transition: transform 0.2s;
    &.visible {
      transform: translateX(0%);
      opacity: 1;
    }
    [data-betterdo-modal-arrow] {
      display: block;
      height: 1.2rem;
      width: 1.2rem;
      left: -0.53rem;
      transform: rotate(45deg);
      border-radius: 0 0 0 3px;
      background: ${theme.colors.modals.contentBackground};
      border-left: 1px solid ${theme.colors.modals.contentBackground};
      border-bottom: 1px solid ${theme.colors.modals.contentBackground};
      box-shadow:
        -1px 1px 0 rgba(255, 255, 255, 0.15),
        -2px 2px 0 rgba(0, 0, 0, 0.6);
    }
  }
`;
