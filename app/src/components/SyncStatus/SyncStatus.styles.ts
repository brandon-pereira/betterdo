import { styled } from "@linaria/react";

import { theme } from "../../theme";

import { RefreshCw } from "lucide-react";

export const Button = styled.button`
  flex-shrink: 0;
  height: 1.9rem;
  width: 1.9rem;
  padding: 0;
  border: none;
  border-radius: 50%;
  color: currentColor;
  background: rgba(0, 0, 0, 0.15);
  box-shadow:
    inset 0 0 0 1px rgba(0, 0, 0, 0.2),
    inset 0 1px rgba(255, 255, 255, 0.15);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  position: relative;
  touch-action: manipulation;
  -webkit-tap-highlight-color: transparent;
  transition:
    filter 0.15s,
    transform 0.15s;
  animation: sync-pop-in 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
  /* Grows the tap target to about 46px without changing the badge's size or layout. */
  &::before {
    content: "";
    position: absolute;
    inset: -0.5rem;
    border-radius: 50%;
  }
  @media (hover: hover) {
    &:hover {
      filter: brightness(1.1);
    }
  }
  &:active {
    transform: scale(0.92);
  }
  &:focus-visible {
    outline: 2px solid ${theme.colors.general.blue};
    outline-offset: 2px;
  }
  &[data-state="offline"] {
    color: #4a3500;
    background: linear-gradient(#ffd166, #f0b429);
    box-shadow:
      0 1px 3px rgba(0, 0, 0, 0.35),
      inset 0 0 0 1px rgba(0, 0, 0, 0.15),
      inset 0 1px rgba(255, 255, 255, 0.5);
  }
  &[data-state="failed"] {
    color: #fff;
    background: linear-gradient(#e53935, ${theme.colors.general.red});
    box-shadow:
      0 1px 3px rgba(0, 0, 0, 0.35),
      inset 0 0 0 1px rgba(0, 0, 0, 0.2),
      inset 0 1px rgba(255, 255, 255, 0.3);
  }
  /* A soft ring pulses outward so an undone change isn't missed. */
  &[data-state="failed"]::after {
    content: "";
    position: absolute;
    inset: 0;
    border-radius: 50%;
    box-shadow: 0 0 0 0 rgba(229, 57, 53, 0.6);
    animation: sync-pulse 2s ease-out 3;
    pointer-events: none;
  }
  svg {
    height: 1rem;
    width: 1rem;
    filter: drop-shadow(0 1px rgba(0, 0, 0, 0.15));
  }
  @media (prefers-reduced-motion: reduce) {
    animation: none;
    &[data-state="failed"]::after {
      animation: none;
    }
  }
  @keyframes sync-pop-in {
    from {
      opacity: 0;
      transform: scale(0.5);
    }
  }
  @keyframes sync-pulse {
    to {
      box-shadow: 0 0 0 8px rgba(229, 57, 53, 0);
    }
  }
`;

export const Spinner = styled(RefreshCw)`
  animation: sync-spin 1s linear infinite;
  @media (prefers-reduced-motion: reduce) {
    animation-duration: 3s;
  }
  @keyframes sync-spin {
    to {
      transform: rotate(360deg);
    }
  }
`;

export const Tooltip = styled.div`
  position: fixed;
  z-index: var(--z-tooltip);
  box-sizing: border-box;
  padding: 0.65rem 0.75rem;
  border: 1px solid ${theme.effects.tooltipBorder};
  border-radius: 0.6rem;
  background: ${theme.effects.tooltipBackground};
  color: #fff;
  font-size: 0.8rem;
  line-height: 1.4;
  box-shadow:
    0 8px 24px rgba(0, 0, 0, 0.35),
    0 2px 6px rgba(0, 0, 0, 0.2);
  animation: sync-tooltip-in 0.14s ease-out;
  /* Arrow pointing back at the status button. */
  &::before {
    content: "";
    position: absolute;
    top: -5px;
    left: var(--arrow-left, 50%);
    width: 10px;
    height: 10px;
    margin-left: -5px;
    background: inherit;
    border-top: inherit;
    border-left: inherit;
    border-top-left-radius: 2px;
    transform: rotate(45deg);
  }
  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
  @keyframes sync-tooltip-in {
    from {
      opacity: 0;
      transform: translateY(-4px);
    }
  }
`;

export const Title = styled.div`
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-weight: 600;
  font-size: 0.85rem;
  svg {
    flex-shrink: 0;
    height: 0.95rem;
    width: 0.95rem;
  }
  &[data-state="offline"] svg {
    color: #ffd166;
  }
  &[data-state="failed"] svg {
    color: #ff6b66;
  }
  &[data-state="syncing"] svg {
    color: rgba(255, 255, 255, 0.7);
  }
`;

export const Detail = styled.p`
  margin: 0.25rem 0 0;
  color: rgba(255, 255, 255, 0.72);
`;

export const DismissButton = styled.button`
  display: block;
  margin: 0.6rem 0 0 auto;
  padding: 0.3rem 0.75rem;
  border: none;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.12);
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.12);
  color: #fff;
  font: inherit;
  font-weight: 600;
  cursor: pointer;
  touch-action: manipulation;
  -webkit-tap-highlight-color: transparent;
  transition: background 0.15s;
  @media (hover: hover) {
    &:hover {
      background: rgba(255, 255, 255, 0.2);
    }
  }
  &:active {
    background: rgba(255, 255, 255, 0.24);
  }
  @media (pointer: coarse) {
    width: 100%;
    min-height: 2.75rem;
    margin-top: 0.75rem;
    font-size: 0.9rem;
  }
  &:focus-visible {
    outline: 2px solid ${theme.colors.general.blue};
    outline-offset: 2px;
  }
`;
