import { styled } from "styled-components";

export const Section = styled.div`
  margin-bottom: 2rem;
  display: grid;
  gap: 0.5rem;
`;

export const SectionHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.body.color};
`;

export const SectionDescription = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.forms.label.color};
  line-height: 1.4;
`;

export const InlineActions = styled.div`
  display: flex;
  gap: 0.75rem;
  align-items: center;
  flex-wrap: wrap;
`;

export const PasskeyList = styled.div`
  border: 1px solid ${({ theme }) => theme.colors.forms.input.borderColor};
  border-radius: 6px;
  padding: 0.75rem;
  background: ${({ theme }) => theme.colors.forms.input.background};
  box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.03);
  display: grid;
  gap: 0.4rem;
`;

export const PasskeyItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.95rem;
  color: ${({ theme }) => theme.colors.body.color};
`;

export const Subtle = styled.span`
  color: ${({ theme }) => theme.colors.forms.label.color};
  font-size: 0.9rem;
`;

export const Success = styled.div`
  background: rgba(41, 121, 255, 0.12);
  color: ${({ theme }) => theme.colors.general.blue};
  padding: 0.5rem 0.75rem;
  border-radius: 4px;
  font-weight: 600;
`;

export const FormRow = styled.div`
  display: grid;
  gap: 0.35rem;
`;
