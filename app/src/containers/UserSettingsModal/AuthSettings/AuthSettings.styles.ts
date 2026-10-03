import { styled } from "@linaria/react";

import { theme } from "../../../theme";

import Button from "@components/Button";

export const Section = styled.section`
  margin-bottom: 1.5rem;
  padding: 1.25rem;
  border-radius: 0.875rem;
  border: 1px solid ${theme.colors.forms.input.borderColor};
  background: ${theme.effects.settingsSectionBackground};
  display: grid;
  gap: 0.75rem;

  &:last-child {
    margin-bottom: 0;
  }
`;

export const SectionHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 700;
  font-size: 1.05rem;
  color: ${theme.colors.body.color};
`;

export const SectionDescription = styled.p`
  margin: 0;
  color: ${theme.colors.forms.label.color};
  line-height: 1.5;
  font-size: 0.9rem;
`;

export const InlineActions = styled.div`
  display: flex;
  gap: 0.75rem;
  align-items: center;
  flex-wrap: wrap;
`;

export const PasskeyList = styled.div`
  display: grid;
  gap: 0.4rem;
`;

export const PasskeyItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.6rem;
  padding: 0.45rem 0.6rem;
  border: 1px solid ${theme.colors.forms.input.borderColor};
  border-radius: 0.5rem;
  background: ${theme.colors.forms.input.background};
  color: ${theme.colors.body.color};
`;

export const PasskeyDetails = styled.div`
  display: grid;
  gap: 0.05rem;
  min-width: 0;

  & > span:first-child {
    font-weight: 600;
    font-size: 0.9rem;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
`;

export const PasskeyActions = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-shrink: 0;
`;

export const EmptyState = styled.div`
  padding: 1rem;
  text-align: center;
  border: 1px dashed ${theme.colors.forms.input.borderColor};
  border-radius: 0.625rem;
  color: ${theme.colors.forms.label.color};
  font-size: 0.9rem;
`;

export const Subtle = styled.span`
  color: ${theme.colors.forms.label.color};
  font-size: 0.85rem;
`;

export const Alert = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
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

export const FormRow = styled.div`
  display: grid;
  gap: 0.35rem;

  & input {
    margin-bottom: 0;
  }
`;

export const FormGrid = styled.div`
  display: grid;
  gap: 0.85rem;
`;

export const ConfirmRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-shrink: 0;
`;

export const LoadingText = styled.div`
  padding: 1rem;
  color: ${theme.colors.forms.label.color};
  font-size: 0.9rem;
`;

// Compact button for this page - the base Button is too large for settings rows.
export const SmallButton = styled(Button)`
  padding: 0.5rem 1.1rem;
  font-size: 0.9rem;
`;

// Extra-compact button used inside passkey rows.
export const TinyButton = styled(Button)`
  padding: 0.35rem 0.85rem;
  font-size: 0.85rem;
`;
