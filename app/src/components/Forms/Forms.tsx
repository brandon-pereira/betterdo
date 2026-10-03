import { forwardRef } from "react";
import { styled } from "@linaria/react";

import { theme } from "../../theme";

const _Input = styled.input`
  appearance: none;
  background: ${theme.colors.forms.input.background};
  width: ${props => props.width || "100%"};
  box-sizing: border-box;
  height: 2.5rem;
  padding: 0 0.875rem;
  border: 1px solid ${theme.colors.forms.input.borderColor};
  box-shadow: none;
  color: ${theme.colors.forms.input.color};
  border-radius: 0.5rem;
  outline: none;
  font: inherit;
  font-size: 0.875rem;
  margin-bottom: 1rem;
  transition:
    border-color 0.1s ease,
    background-color 0.1s ease;

  // hack for chrome to make date picker white
  [data-theme="dark"] &::-webkit-calendar-picker-indicator {
    filter: invert(1);
  }
  &:focus {
    border-color: ${theme.colors.general.blue};
  }
  &::placeholder {
    color: ${theme.effects.subtleText};
  }
  &[disabled] {
    opacity: 0.6;
    cursor: not-allowed;
  }
  &[data-invalid="true"] {
    border-color: ${theme.colors.general.red} !important;
  }
`;

const Error = styled.div`
  background: color-mix(in srgb, ${theme.colors.general.red} 8%, transparent);
  border: 1px solid ${theme.colors.general.red};
  color: ${theme.colors.general.red};
  padding: 0.75rem 1rem;
  margin: 0 0 1rem 0;
  border-radius: 0.5rem;
  font-size: 0.9rem;
  font-weight: 500;
`;

const Label = styled.label`
  color: ${theme.colors.forms.label.color};
  margin: 0 0 0.4rem;
  display: block;
`;

const Form = ({
  children,
  errorMessage,
  ...props
}: {
  children: React.ReactNode;
  errorMessage?: string;
} & React.DetailedHTMLProps<React.FormHTMLAttributes<HTMLFormElement>, HTMLFormElement>) => (
  <form {...props}>
    {errorMessage ? <Error>{errorMessage}</Error> : null}
    {children}
  </form>
);

type InputProps = {
  invalid?: boolean;
};
const Input = forwardRef<
  HTMLInputElement,
  InputProps & React.DetailedHTMLProps<React.InputHTMLAttributes<HTMLInputElement>, HTMLInputElement>
>(({ placeholder, invalid, ...props }, ref) => (
  <_Input
    {...props}
    ref={ref}
    aria-label={placeholder}
    placeholder={placeholder}
    data-invalid={invalid ? "true" : "false"}
  />
));
Input.displayName = "Input";

export { Input, Label, Form, Error };
