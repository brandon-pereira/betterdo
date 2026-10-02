import { forwardRef, useState } from "react";
import { AuthInput, PasswordField, PasswordToggle } from "./Auth.styles";
import EyeIcon from "@components/Icon/svgs/eye.svg";
import EyeOffIcon from "@components/Icon/svgs/eye-off.svg";

type Props = React.DetailedHTMLProps<React.InputHTMLAttributes<HTMLInputElement>, HTMLInputElement>;

const PasswordInput = forwardRef<HTMLInputElement, Props>((props, ref) => {
  const [visible, setVisible] = useState(false);

  return (
    <PasswordField>
      <AuthInput {...props} ref={ref} type={visible ? "text" : "password"} />
      <PasswordToggle
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
