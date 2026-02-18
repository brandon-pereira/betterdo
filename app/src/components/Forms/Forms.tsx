import { forwardRef } from "react";
import { styled } from "styled-components";

const _Input = styled.input<{ $invalid?: boolean }>`
  appearance: none;
  background: ${({ theme }) => theme.colors.forms.input.background};
  width: ${props => props.width || "100%"};
  box-sizing: border-box;
  padding: 0.85rem 1rem;
  border: none;
  box-shadow: ${({ theme }) => theme.colors.forms.input.boxShadow};
  color: ${({ theme }) => theme.colors.forms.input.color};
  border-radius: 0.625rem;
  outline: none;
  font: inherit;
  font-size: 1rem;
  margin-bottom: 1rem;
  transition:
    box-shadow 0.2s ease,
    background-color 0.2s ease;

  // hack for chrome to make date picker white
  ${({ theme }) =>
    theme.isDarkMode &&
    `
        &::-webkit-calendar-picker-indicator {
            filter: invert(1);
        }
    `}
  &:focus {
    box-shadow: inset 0 0 0 2px ${({ theme }) => theme.colors.general.blue};
  }
  &::placeholder {
    color: ${({ theme }) => (theme.isDarkMode ? "#888" : "#999")};
  }
  &[disabled] {
    opacity: 0.6;
    cursor: not-allowed;
  }
  ${({ theme, $invalid }) =>
    $invalid &&
    `
      box-shadow: inset 0 0 0 2px ${theme.colors.general.red} !important;
    `};
`;

const Error = styled.div`
  background: ${({ theme }) => theme.colors.general.red}15;
  border: 1px solid ${({ theme }) => theme.colors.general.red};
  color: ${({ theme }) => theme.colors.general.red};
  padding: 0.75rem 1rem;
  margin: 0 0 1rem 0;
  border-radius: 0.5rem;
  font-size: 0.9rem;
  font-weight: 500;
`;

const Label = styled.label`
  color: ${({ theme }) => theme.colors.forms.label.color};
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
  <_Input {...props} ref={ref} aria-label={placeholder} placeholder={placeholder} $invalid={invalid} />
));
Input.displayName = "Input";

export { Input, Label, Form, Error };
