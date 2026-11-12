import { styled } from "@linaria/react";
import { m } from "framer-motion";

import { theme } from "../../../theme";

// Rotating red→blue glow behind a solid card, matching the AI section on the marketing site.
export const Hero = styled.div`
  --glow-width: 3px;
  position: relative;
  isolation: isolate;
  overflow: hidden;
  padding: var(--glow-width);
  border-radius: 1rem;
  &:after {
    content: "";
    position: absolute;
    top: 50%;
    left: 50%;
    z-index: -2;
    width: 150%;
    aspect-ratio: 1;
    translate: -50% -50%;
    background-image: linear-gradient(-40deg, red, blue);
    filter: blur(40px);
    animation: agents-glow 10s linear infinite;
  }
  @media (prefers-reduced-motion: reduce) {
    &:after {
      animation: none;
    }
  }
  @keyframes agents-glow {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }
`;

export const HeroContent = styled.div`
  display: grid;
  gap: 0.35rem;
  padding: 1.5rem 1.25rem;
  border-radius: calc(1rem - var(--glow-width));
  text-align: center;
  color: ${theme.colors.body.color};
  background: ${theme.colors.forms.input.background};
`;

export const HeroTitle = styled.div`
  font-size: 0.85rem;
  color: ${theme.colors.forms.label.color};
`;

export const Prompt = styled.div`
  position: relative;
  height: 1.75rem;
  overflow: hidden;
  font-size: 1.2rem;
  font-weight: 600;
  line-height: 1.75rem;
`;

export const PromptText = styled(m.div)`
  position: absolute;
  inset: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

export const CopyField = styled.div`
  display: flex;
  align-items: stretch;
  gap: 0.5rem;
  min-width: 0;
`;

export const Code = styled.code`
  flex: 1;
  min-width: 0;
  display: block;
  padding: 0.55rem 0.75rem;
  border-radius: 0.5rem;
  border: 1px solid ${theme.colors.forms.input.borderColor};
  background: ${theme.colors.forms.input.background};
  color: ${theme.colors.forms.input.color};
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 0.8rem;
  line-height: 1.5;
  white-space: pre;
  overflow-x: auto;
`;

export const ClientPicker = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
`;

export const ClientOption = styled.button`
  appearance: none;
  font: inherit;
  font-size: 0.85rem;
  padding: 0.35rem 0.9rem;
  border-radius: 999px;
  cursor: pointer;
  color: ${theme.colors.body.color};
  background: ${theme.colors.forms.input.background};
  border: 1px solid ${theme.colors.forms.input.borderColor};
  &:hover {
    border-color: ${theme.colors.general.blue};
  }
  &:focus-visible {
    outline: 2px solid ${theme.colors.general.blue};
    outline-offset: 2px;
  }
  &[aria-pressed="true"] {
    color: #fff;
    font-weight: 600;
    background: ${theme.colors.general.blue};
    border-color: ${theme.colors.general.blue};
  }
`;

export const Steps = styled.ol`
  margin: 0;
  padding: 0 0 0 1.25rem;
  display: grid;
  gap: 0.6rem;
  color: ${theme.colors.body.color};
  font-size: 0.9rem;
  line-height: 1.5;
  li > ${CopyField} {
    margin-top: 0.4rem;
  }
`;

export const AppIcon = styled.div`
  width: 2rem;
  height: 2rem;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  border-radius: 0.5rem;
  font-weight: 700;
  color: #fff;
  background: ${theme.colors.general.blue};
  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;
