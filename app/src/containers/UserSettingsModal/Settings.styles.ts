import { styled } from "@linaria/react";

import { theme } from "../../theme";

import Button from "@components/Button";

// Shared building blocks for every settings tab: titled sections holding a
// card of rows, where each row is a label + description with a control on the right.

export const Page = styled.div`
  display: grid;
  gap: 1.75rem;
`;

export const Section = styled.section`
  display: grid;
  gap: 0.75rem;
`;

export const SectionHeader = styled.div`
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 1rem;
`;

export const SectionTitle = styled.h3`
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
  line-height: 1.3;
  color: ${theme.colors.body.color};
`;

export const SectionDescription = styled.p`
  margin: 0;
  max-width: 34rem;
  color: ${theme.colors.forms.label.color};
  line-height: 1.45;
  font-size: 0.85rem;
  text-wrap: pretty;
  /* Sit tight under the title so the pair reads as one heading, separate from the card below. */
  ${SectionHeader} + & {
    margin-top: -0.55rem;
  }
`;

export const Card = styled.div`
  border-radius: 0.875rem;
  border: 1px solid ${theme.colors.forms.input.borderColor};
  background: ${theme.effects.settingsSectionBackground};
  overflow: hidden;
`;

export const Row = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.85rem 1rem;
  color: ${theme.colors.body.color};
  &:not(:first-child) {
    border-top: 1px solid ${theme.colors.forms.input.borderColor};
  }
  select {
    max-width: 15rem;
  }
  @media (max-width: 500px) {
    &[data-stack="true"] {
      flex-direction: column;
      align-items: stretch;
    }
  }
`;

// Full-width content (forms, lists) nested under a Row inside the same Card.
export const RowBody = styled.div`
  padding: 0 1rem 1rem;
  display: grid;
  gap: 0.75rem;
`;

export const AccordionItem = styled.div`
  &:not(:first-child) {
    border-top: 1px solid ${theme.colors.forms.input.borderColor};
  }
`;

export const AccordionTrigger = styled.button`
  appearance: none;
  width: 100%;
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.85rem 1rem;
  border: none;
  background: none;
  font: inherit;
  text-align: left;
  cursor: pointer;
  color: ${theme.colors.body.color};
  &:hover {
    background: ${theme.effects.hoverOverlay};
  }
  &:focus-visible {
    outline: 2px solid ${theme.colors.general.blue};
    outline-offset: -2px;
  }
  svg {
    width: 1rem;
    height: 1rem;
    flex-shrink: 0;
    fill: ${theme.colors.forms.label.color};
    transform: rotate(180deg);
    transition: transform 0.2s ease;
  }
  &[aria-expanded="true"] svg {
    transform: rotate(0deg);
  }
`;

// Animates open/closed by transitioning the grid row between 0fr and 1fr.
export const AccordionPanel = styled.div`
  display: grid;
  grid-template-rows: 0fr;
  transition: grid-template-rows 0.2s ease;
  &[data-open="true"] {
    grid-template-rows: 1fr;
  }
  & > div {
    overflow: hidden;
    min-height: 0;
  }
  &[data-open="false"] > div {
    visibility: hidden;
  }
`;

export const RowText = styled.div`
  flex: 1;
  min-width: 0;
  display: grid;
  gap: 0.15rem;
`;

export const RowTitle = styled.div`
  font-weight: 600;
  font-size: 0.95rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

export const RowDescription = styled.div`
  color: ${theme.colors.forms.label.color};
  font-size: 0.85rem;
  line-height: 1.45;
`;

export const RowActions = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-shrink: 0;
`;

export const ItemList = styled.div`
  display: grid;
  gap: 0.4rem;
`;

export const Item = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.5rem 0.5rem 0.5rem 0.75rem;
  border: 1px solid ${theme.colors.forms.input.borderColor};
  border-radius: 0.5rem;
  background: ${theme.colors.forms.input.background};
  color: ${theme.colors.body.color};
`;

export const Subtle = styled.span`
  color: ${theme.colors.forms.label.color};
  font-size: 0.85rem;
`;

export const EmptyState = styled.div`
  padding: 1rem;
  text-align: center;
  border: 1px dashed ${theme.colors.forms.input.borderColor};
  border-radius: 0.625rem;
  color: ${theme.colors.forms.label.color};
  font-size: 0.9rem;
`;

export const LoadingText = styled.div`
  padding: 1rem;
  color: ${theme.colors.forms.label.color};
  font-size: 0.9rem;
`;

export const Alert = styled.div`
  padding: 0.65rem 0.85rem;
  border-radius: 0.5rem;
  font-size: 0.9rem;
  font-weight: 500;
  line-height: 1.4;
  --alert-color: ${theme.colors.general.blue};
  background: color-mix(in srgb, var(--alert-color) 8%, transparent);
  border: 1px solid var(--alert-color);
  color: var(--alert-color);
  &[data-variant="error"] {
    --alert-color: ${theme.colors.general.red};
  }
`;

export const FormGrid = styled.div`
  display: grid;
  gap: 0.85rem;
  & label {
    margin-bottom: 0.35rem;
  }
`;

export const InlineActions = styled.div`
  display: flex;
  gap: 0.5rem;
  align-items: center;
  flex-wrap: wrap;
`;

// The base Button is sized for full forms; settings rows need something tighter.
export const SmallButton = styled(Button)`
  padding: 0.5rem 1.1rem;
  font-size: 0.9rem;
`;

export const TinyButton = styled(Button)`
  padding: 0.35rem 0.85rem;
  font-size: 0.85rem;
`;
