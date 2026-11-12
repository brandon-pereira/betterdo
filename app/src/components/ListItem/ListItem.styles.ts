import { m } from "framer-motion";
import { styled } from "@linaria/react";

import { DEFAULT_LIST_COLOR } from "../../constants";
import { theme } from "../../theme";

export const NAV_ITEM_TRANSITION = { type: "spring", stiffness: 500, damping: 40 } as const;

export const Container = styled.button`
  border: none;
  display: block;
  font: inherit;
  width: 100%;
  text-align: left;
  outline: none;
  user-select: none;
  z-index: 5;
  position: relative;
  cursor: pointer;
  color: #fff;
  display: flex;
  align-items: center;
  background: transparent;
  &::before {
    content: "";
    position: absolute;
    inset: 0;
    background: linear-gradient(
      90deg,
      color-mix(in srgb, var(--list-color, ${DEFAULT_LIST_COLOR}) 35%, transparent),
      transparent 65%
    );
    opacity: 0;
    transform: scaleX(0.4);
    transform-origin: left;
    transition:
      opacity 0.5s ease,
      transform 0.5s ease;
    pointer-events: none;
  }
  &::after {
    content: "";
    position: absolute;
    left: 0;
    right: 0;
    bottom: 0;
    height: 1px;
    background: linear-gradient(
      90deg,
      transparent,
      ${theme.colors.navigation.divider} 20%,
      ${theme.colors.navigation.divider} 80%,
      transparent
    );
    pointer-events: none;
  }
  &[data-selected="true"] {
    z-index: 6;
  }
  &[data-selected="true"]::after {
    opacity: 0;
  }
  &:focus-visible {
    background: ${theme.colors.navigation.hover};
  }
  &:focus-visible::before {
    opacity: 1;
    transform: scaleX(1);
    transition-duration: 0.35s;
  }
  @media (hover: hover) {
    &:hover::before {
      opacity: 1;
      transform: scaleX(1);
      transition-duration: 0.35s;
    }
  }
`;

export const HoveredItemBackground = styled(m.div)`
  background: ${theme.colors.navigation.hover};
  position: absolute;
  inset: 0;
`;

export const SelectedItemBackground = styled(m.div)`
  box-shadow:
    inset 0 1px rgba(255, 255, 255, 0.2),
    inset 0 -1px rgba(0, 0, 0, 0.5),
    0 2px 6px rgba(0, 0, 0, 0.35);
  background: linear-gradient(#006eff, #004db4);
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
`;

export const DotIcon = styled.div`
  height: 1rem;
  width: 1rem;
  background-color: var(--dot-color, ${DEFAULT_LIST_COLOR});
  background-image: linear-gradient(transparent, rgba(0, 0, 0, 0.2));
  box-shadow:
    inset 0 0 0 1px rgba(0, 0, 0, 0.5),
    0 1px 10px rgba(0, 0, 0, 0.4);
  border-radius: 50%;
`;

export const DateIcon = styled.div`
  height: 1.4rem;
  width: 1.1rem;
  overflow: hidden;
  /* Using the 2 values on box-shadow gave me more flexibility */
  box-shadow:
    inset 0 0 0 1px #fff,
    inset 0 -3px 0 1px #fff;
  font-weight: 800;
  font-size: 12px;
  /* height of container - bottom border */
  line-height: calc(1.4rem - 3px);
`;

export const Title = styled.span`
  position: relative;
  z-index: 1;
  text-shadow: 1px 1px rgba(0, 0, 0, 0.1);
  flex: 1;
  padding: 1rem 1rem 1rem 0;
  text-overflow: ellipsis;
  overflow: hidden;
  white-space: nowrap;
  transition: color 0.2s ease;
  ${Container}[data-selected="true"] & {
    font-weight: 600;
  }
`;
export const IconHolder = styled.div`
  position: relative;
  z-index: 1;
  touch-action: none;
  width: 50px;
  height: 50px;
  display: flex;
  justify-content: center;
  align-items: center;
  text-align: center;
  * {
    filter: drop-shadow(0 1px #000);
  }
`;
