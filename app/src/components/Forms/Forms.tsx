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

// Groups a Label with its input as a single stack item so the Form's gap spaces
// fields apart while the Label stays tight to its own input.
const Field = styled.div`
  display: flex;
  flex-direction: column;
`;

// Inline, per-field validation message shown beneath an input. The shared Input
// renders this automatically when given an `errorMessage`.
const FieldError = styled.div`
  color: ${theme.colors.general.red};
  font-size: 0.8rem;
  margin-top: 0.1rem;
  margin-left: 0.2rem;
`;

// Forms lay out their children as a vertical stack. Spacing between fields is
// owned here (gap) rather than by per-input margins, so inputs stay layout-free
// and composable. Label carries its own small margin to sit tight to its input.
const _Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const Form = ({
  children,
  errorMessage,
  ...props
}: {
  children: React.ReactNode;
  errorMessage?: string;
} & React.DetailedHTMLProps<React.FormHTMLAttributes<HTMLFormElement>, HTMLFormElement>) => (
  <_Form {...props}>
    {errorMessage ? <Error>{errorMessage}</Error> : null}
    {children}
  </_Form>
);

type InputProps = {
  // Validation message for this field. When present the input is marked invalid
  // and the message is rendered beneath it. Prefer this over `invalid` so error
  // styling and messaging stay in sync.
  errorMessage?: string;
  // Escape hatch to force the invalid style without a message.
  invalid?: boolean;
};
const Input = forwardRef<
  HTMLInputElement,
  InputProps & React.DetailedHTMLProps<React.InputHTMLAttributes<HTMLInputElement>, HTMLInputElement>
>(({ placeholder, errorMessage, invalid, ...props }, ref) => {
  const isInvalid = invalid || Boolean(errorMessage);
  return (
    <div>
      <_Input
        {...props}
        ref={ref}
        aria-label={placeholder}
        placeholder={placeholder}
        aria-invalid={isInvalid ? "true" : undefined}
        data-invalid={isInvalid ? "true" : "false"}
        data-has-error={errorMessage ? "true" : "false"}
      />
      {errorMessage ? <FieldError role="alert">{errorMessage}</FieldError> : null}
    </div>
  );
});
Input.displayName = "Input";

export { Input, Label, Field, Form, Error };
