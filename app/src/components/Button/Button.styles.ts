import { styled, CSSProperties } from "styled-components";

import _Loader from "@components/Loader";

export const StyledButton = styled.button.attrs(({ color, theme }) => {
  const style = {
    "--color": theme.colors.general[color as keyof typeof theme.colors.general] || color || theme.colors.general.blue
  } as CSSProperties;
  return { style };
})<{ isLoading?: boolean; $variant?: "primary" | "secondary" }>`
  border: none;
  background-color: var(--color);
  color: #fff;
  border-radius: 50px;
  padding: 1rem 2rem;
  text-align: center;
  font: inherit;
  background-image: linear-gradient(transparent, rgba(0, 0, 0, 0.3));
  font-size: 1rem;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  outline: none;
  display: ${({ hidden }) => (hidden ? "none" : "inline-flex")};
  align-items: center;
  box-shadow:
    0 3px 6px rgba(0, 0, 0, 0.16),
    0 3px 6px rgba(0, 0, 0, 0.23);
  &:hover {
    filter: brightness(0.9);
  }
  &:focus-visible {
    box-shadow: 0 0 0 2px ${({ theme }) => theme.colors.general.blue};
  }
  ${({ $variant, theme }) =>
    $variant === "secondary" &&
    `
    color: var(--color);
    border: 1px solid var(--color);
    background: none;
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

export const Loader = styled(_Loader)`
  margin-right: 1rem;
`;
