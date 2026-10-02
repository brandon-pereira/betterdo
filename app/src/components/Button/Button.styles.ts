import { styled, CSSProperties } from "styled-components";

import _Loader from "@components/Loader";

export const StyledButton = styled.button.attrs(({ color, theme }) => {
  const style = {
    "--color": theme.colors.general[color as keyof typeof theme.colors.general] || color || theme.colors.general.blue
  } as CSSProperties;
  return { style };
})<{ isLoading?: boolean; $variant?: "primary" | "secondary"; $fullWidth?: boolean }>`
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
  display: ${({ hidden }) => (hidden ? "none" : "inline-flex")};
  width: ${({ $fullWidth }) => ($fullWidth ? "100%" : "auto")};
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
    outline: 2px solid ${({ theme }) => theme.colors.general.blue};
    outline-offset: 2px;
  }
  &:disabled {
    opacity: 0.5;
    pointer-events: none;
  }
  ${({ theme, $variant }) =>
    $variant === "secondary" &&
    `
    color: ${theme.colors.forms.input.color};
    border: 1px solid ${theme.colors.forms.input.borderColor};
    background: ${theme.colors.forms.input.background};
    &:hover {
      background: ${theme.isDarkMode ? "rgba(255, 255, 255, 0.06)" : "rgba(0, 0, 0, 0.04)"};
    }
  `}
  ${props =>
    props.isLoading &&
    `
            pointer-events: none;
            &:before {
                opacity: 1;
                background: rgba(255, 255, 255, 0.3);
            }
        `};

  span {
    flex: 1;
  }
`;

export const Loader = styled(_Loader)``;
