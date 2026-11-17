import { styled } from "@linaria/react";

import { theme } from "../../theme";

import { RefreshCw } from "lucide-react";

export const Button = styled.button`
  flex-shrink: 0;
  height: 2rem;
  width: 2rem;
  padding: 0;
  border: none;
  border-radius: 50%;
  background: transparent;
  color: currentColor;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  &:focus-visible {
    outline: 2px solid ${theme.colors.general.blue};
    outline-offset: 2px;
  }
`;

export const Dot = styled.span`
  height: 0.9rem;
  width: 0.9rem;
  border-radius: 50%;
  box-shadow: 0 0 0 2px rgba(0, 0, 0, 0.25);
  &[data-state="offline"] {
    background-color: #f0b429;
  }
  &[data-state="failed"] {
    background-color: ${theme.colors.general.red};
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
  z-index: var(--z-modal-overlay);
  box-sizing: border-box;
  padding: 0.8rem 1rem;
  border-radius: 0.6rem;
  background: #111;
  color: #fff;
  font-size: 1.3rem;
  line-height: 1.4;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
`;

export const DismissButton = styled.button`
  display: block;
  margin-top: 0.6rem;
  padding: 0;
  border: none;
  background: none;
  color: #fff;
  font: inherit;
  font-weight: 600;
  text-decoration: underline;
  cursor: pointer;
`;
