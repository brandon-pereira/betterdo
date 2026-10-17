import { forwardRef, useState } from "react";
import { PasswordField, PasswordToggle } from "./Auth.styles";
import { Input } from "@components/Forms";
import EyeIcon from "@components/Icon/svgs/eye.svg";
import EyeOffIcon from "@components/Icon/svgs/eye-off.svg";

type Props = React.DetailedHTMLProps<React.InputHTMLAttributes<HTMLInputElement>, HTMLInputElement> & {
  invalid?: boolean;
  errorMessage?: string;
};

const PasswordInput = forwardRef<HTMLInputElement, Props>((props, ref) => {
  const [visible, setVisible] = useState(false);

  return (
    <PasswordField>
      <Input {...props} ref={ref} type={visible ? "text" : "password"} />
      <PasswordToggle
        type="button"
        onClick={() => setVisible(v => !v)}
        aria-label={visible ? "Hide password" : "Show password"}
        aria-pressed={visible}
      >
        {visible ? <EyeOffIcon aria-hidden="true" /> : <EyeIcon aria-hidden="true" />}
      </PasswordToggle>
    </PasswordField>
  );
});

PasswordInput.displayName = "PasswordInput";

export default PasswordInput;
