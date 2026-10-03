import { styled } from "@linaria/react";

import { theme } from "../../theme";

import _Loader from "@components/Loader";

export const StyledButton = styled.button<{
  $fullWidth?: boolean;
}>`
  border: 1px solid transparent;
  background-color: var(--color);
  color: #fff;
  border-radius: 0.5rem;
  padding: 0 1.125rem;
  height: 2.5rem;
  text-align: center;
  font: inherit;
  font-size: 0.875rem;
  font-weight: 600;
  line-height: 1;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  outline: none;
  display: ${props => (props.hidden ? "none" : "inline-flex")};
  width: ${props => (props.$fullWidth ? "100%" : "auto")};
  justify-content: center;
  align-items: center;
  gap: 0.5rem;
  transition:
    background-color 0.1s ease,
    border-color 0.1s ease,
    color 0.1s ease;
  &:hover {
    background-color: color-mix(in srgb, var(--color) 88%, #000);
  }
  &:active {
    transform: translateY(1px);
  }
  &:focus-visible {
    outline: 2px solid ${theme.colors.general.blue};
    outline-offset: 2px;
  }
  &:disabled {
    opacity: 0.5;
    pointer-events: none;
  }
  &[data-variant="secondary"] {
    color: ${theme.colors.forms.input.color};
    border: 1px solid ${theme.colors.forms.input.borderColor};
    background: ${theme.colors.forms.input.background};
    &:hover {
      background: ${theme.effects.hoverOverlay};
    }
  }
  &[data-loading="true"] {
    pointer-events: none;
    &:before {
      opacity: 1;
      background: rgba(255, 255, 255, 0.3);
    }
  }

  span {
    flex: 1;
  }
`;

export const Loader = styled(_Loader)``;
