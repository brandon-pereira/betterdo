import { useCallback, useState } from "react";

import { Switch, Slider } from "./Toggle.styles";
import { vibrate } from "@utilities/haptics";

interface Props {
  value: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>, newState: boolean) => void;
  disabled?: boolean;
}

function Toggle({ value, onChange, disabled }: Props) {
  const [checked, setChecked] = useState(value || false);

  const _onChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newState = e.target.checked;
      vibrate("tap");
      setChecked(newState);
      if (onChange) {
        onChange(e, newState);
      }
    },
    [onChange]
  );

  return (
    <Switch disabled={disabled}>
      <input type="checkbox" checked={checked} onChange={_onChange} disabled={disabled} />
      <Slider disabled={disabled} />
    </Switch>
  );
}

export default Toggle;
