import { QUERIES } from "../../constants";
import { styled } from "styled-components";
import { Input } from "@components/Forms";

// The shared Forms Input carries a bottom margin for stacked forms; inside the
// auth screens spacing is handled by <Stack>, so strip it here.
export const AuthInput = styled(Input)`
  margin-bottom: 0;
`;

export const Container = styled.div`
  display: grid;
  overflow: auto;
  grid-template-rows: 1fr;
  grid-template-columns: 1fr;
  gap: 2rem;
  width: 100%;
  height: 100%;

  background: ${({ theme }) => theme.colors.body.background};
  ${({ theme }) => theme.queries.large} {
    grid-template-columns: 1fr 1fr;
    gap: 2rem;
  }
`;

export const LogoSection = styled.div`
  display: flex;
  margin: 2rem auto;
  width: 90%;
  padding: 2rem;
  border-radius: 2rem;
  position: relative;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  box-shadow:
    inset 0 0 0 10px rgba(255, 255, 255, 0.05),
    0 0 2px rgba(0, 0, 0, 1);
  background: linear-gradient(
    -45deg,
    ${({ theme }) => theme.colors.general.blue},
    color-mix(in srgb, ${({ theme }) => theme.colors.general.blue}, #000)
  );

  path {
    stroke-width: 1px;
    fill: rgba(255, 255, 255, 0.2);
    stroke: #000;
    stroke-width: 0px;
  }

  svg {
    width: 75%;
    max-width: 30rem;
    height: auto;
    aspect-ratio: 1 / 1;
    margin-bottom: 1rem;
    filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.3));
  }

  ${QUERIES.large} {
    width: unset;
    margin: 2rem 2rem 2rem 0;
  }
`;

export const BrandTitle = styled.h1`
  grid-row: 1;
  top: 1rem;
  left: 1rem;
  color: #fff;
  font-size: 2.5rem;
  font-weight: 300;
  margin: 0;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  a {
    color: inherit;
  }
  span {
    font-weight: 600;
  }

  ${QUERIES.large} {
    position: absolute;
  }
`;

export const FormSection = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
`;

export const AuthButtons = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 1rem;
`;

export const AuthProviders = styled.div`
  display: flex;
  gap: 1rem;
  button {
    flex: 1;
  }
`;

export const FormWrapper = styled.div`
  --background-color: ${({ theme }) => theme.colors.modals.contentBackground};
  background: var(--background-color);
  color: ${({ theme }) => theme.colors.body.color};
  border-radius: 2rem;
  padding: 2rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  gap: 1rem;
  width: 90%;
  max-width: 400px;
  ${QUERIES.large} {
    width: 100%;
  }
`;

export const Title = styled.h2`
  font-size: 2rem;
  font-weight: 500;
  text-align: center;
  margin: 0 0 1rem;
`;

export const Stack = styled.div<{ $gap?: string; $align?: string }>`
  display: flex;
  flex-direction: column;
  gap: ${({ $gap }) => $gap || "1rem"};
  ${({ $align }) => $align && `align-items: ${$align};`}
`;

export const Group = styled.div<{ $justify?: string; $gap?: string }>`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: ${({ $justify }) => $justify || "flex-start"};
  gap: ${({ $gap }) => $gap || "0.5rem"};
`;

export const Center = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
`;

export const DimmedText = styled.p<{ $align?: string }>`
  margin: 0;
  font-size: 0.875rem;
  color: ${({ theme }) => theme.colors.forms.label.color};
  ${({ $align }) => $align && `text-align: ${$align};`}
`;

export const Alert = styled.div<{ $color?: "red" | "green" | "blue" }>`
  --alert-color: ${({ theme, $color }) =>
    $color === "green" ? "#2f9e44" : $color === "red" ? theme.colors.general.red : theme.colors.general.blue};
  border: 1px solid var(--alert-color);
  background: color-mix(in srgb, var(--alert-color) 12%, transparent);
  color: ${({ theme }) => theme.colors.body.color};
  padding: 0.75rem 1rem;
  border-radius: 0.5rem;
  font-size: 0.9rem;
`;

export const AlertTitle = styled.div`
  font-weight: 600;
  margin-bottom: 0.25rem;
  color: var(--alert-color);
`;

export const Divider = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  color: ${({ theme }) => theme.colors.forms.label.color};
  font-size: 0.875rem;

  &::before,
  &::after {
    content: "";
    flex: 1;
    height: 1px;
    background: ${({ theme }) => theme.colors.forms.input.borderColor};
  }
`;

export const PasswordField = styled.div`
  position: relative;

  input {
    padding-right: 3rem;
  }
`;

export const PasswordToggle = styled.button.attrs({ type: "button" })`
  position: absolute;
  top: 0;
  right: 0;
  height: 2.5rem;
  width: 2.75rem;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  margin: 0;
  border: none;
  background: none;
  cursor: pointer;
  color: ${({ theme }) => theme.colors.forms.label.color};

  svg {
    width: 1.25rem;
    height: 1.25rem;
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.general.blue};
    outline-offset: -2px;
    border-radius: 0.5rem;
  }
`;

export const VisuallyHidden = styled.div`
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
`;
