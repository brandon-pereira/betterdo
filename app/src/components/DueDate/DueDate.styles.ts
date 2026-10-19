import { styled } from "@linaria/react";

import { theme } from "../../theme";

import { Input } from "@components/Forms";

export const DueDateInput = styled(Input)`
  visibility: hidden;
  position: absolute;
  top: 0;
  left: 0;
`;
export const Container = styled.div`
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 0.75rem;
`;

export const DayIcon = styled.div`
  height: 30px;
  width: 30px;
  padding-top: 3px;
  box-sizing: border-box;
  font-size: 16px;
  box-shadow: inset 0 -1px 0 3px currentColor;
`;

export const ItemContainer = styled.button`
  position: relative;
  background: none;
  border: none;
  color: ${theme.colors.forms.label.color};
  text-align: center;
  font: inherit;
  display: grid;
  justify-items: center;
  align-content: center;
  gap: 0.7rem;
  cursor: pointer;
  border-radius: 5px;
  padding: 1rem 0;
  margin: 0;

  outline: none;

  &:focus-visible {
    outline: 2px solid var(--accent-color, ${theme.colors.general.blue});
    outline-offset: 2px;
  }
  &[data-selected="true"] {
    background: var(--accent-color, ${theme.effects.tintStrong});
    color: var(--on-accent-color, ${theme.colors.forms.label.color});
    &:hover {
      background: var(--accent-color, ${theme.effects.tintStrong});
    }
  }
  @media (forced-colors: active) {
    &[data-selected="true"] {
      forced-color-adjust: none;
      background: Highlight;
      color: HighlightText;
    }
  }
`;

export const ItemLabel = styled.label`
  cursor: inherit;
`;
