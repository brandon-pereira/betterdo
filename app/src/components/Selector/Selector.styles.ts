import { styled } from "@linaria/react";

import { theme } from "../../theme";

export const Container = styled.div`
  display: flex;
  border-radius: 3px;
`;
export const Selection = styled.button`
  flex: 1;
  appearance: none;
  border: none;
  margin: 0;
  background: ${theme.colors.forms.selector.background};
  color: ${theme.colors.forms.selector.color};
  box-shadow: ${theme.colors.forms.selector.boxShadow};
  padding: 0.75rem 1rem;
  font: inherit;
  outline: none;
  &:first-of-type {
    border-radius: 5px 0 0 5px;
  }
  &:last-of-type {
    border-right: none;
    border-radius: 0 5px 5px 0;
  }
  cursor: pointer;
  &:focus-visible {
    /* Offset ring sits on the surface, so it needs >= 3:1 against it (the accent palette guarantees this). */
    outline: 2px solid var(--accent-color, ${theme.colors.general.blue});
    outline-offset: 2px;
    position: relative;
    z-index: 2;
  }
  &[data-selected="true"] {
    background-color: var(--accent-color, ${theme.colors.general.blue});
    background-image: linear-gradient(transparent, rgba(0, 0, 0, 0.3));
    box-shadow: inset 0 -2px rgba(0, 0, 0, 0.2);
    position: relative;
    z-index: 1;
    color: var(--on-accent-color, #fff);
    font-weight: 600;
  }
  @media (forced-colors: active) {
    /* Backgrounds are stripped in forced colors; use system colors so the selection stays visible. */
    &[data-selected="true"] {
      forced-color-adjust: none;
      background: Highlight;
      color: HighlightText;
    }
  }
`;
