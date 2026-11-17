import { styled } from "@linaria/react";

export const Anchor = styled.span`
  display: inline-flex;
`;

export const Bubble = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  z-index: var(--z-modal-overlay);
  max-width: 16rem;
  padding: 0.35rem 0.6rem;
  border-radius: 0.4rem;
  background: #111;
  color: #fff;
  font-size: 0.8rem;
  font-weight: 500;
  line-height: 1.3;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.35);
  pointer-events: none;
  animation: tooltip-in 0.12s ease-out;
  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
  @keyframes tooltip-in {
    from {
      opacity: 0;
    }
  }
`;
