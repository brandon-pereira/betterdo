import { styled } from "@linaria/react";

import { theme } from "../../theme";

export const IconContainer = styled.div<{ size?: string; color?: string; type?: "button"; as?: "button" | "div" }>`
  height: ${props => props.size || "1rem"};
  width: ${props => props.size || "1rem"};
  background: none;
  border: none;
  outline: none;
  cursor: ${props => (props.onClick ? "pointer" : "default")};
  position: relative;
  svg {
    position: absolute;
    left: 0;
    top: 0;
    color: ${props => props.color || "#000"};
    height: 100%;
    width: 100%;
  }
  /* Lucide icons are stroked with currentColor; a fill would paint them solid. */
  svg:not(.lucide) {
    fill: ${props => props.color || "#000"};
  }
  &:focus-visible {
    svg {
      color: ${theme.colors.general.blue};
    }
    svg:not(.lucide) {
      fill: ${theme.colors.general.blue};
    }
  }
`;
