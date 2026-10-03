import { styled } from "@linaria/react";

import { theme } from "../../theme";

import _Modal from "@components/Modal";

export const Modal = styled(_Modal)`
  width: 100%;
  max-width: 800px;
  border-radius: 1.25rem;
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
  & [data-betterdo-modal-content] {
    padding: 2rem;
  }
`;
