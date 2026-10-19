import { useCallback } from "react";

import { Container, Selection } from "./Selector.styles";

// this is a fairly primitive implementation, could this use generics?
interface Props {
  value?: string;
  values: {
    value: string;
    label: string;
  }[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onSelect: (value: any) => void;
  "aria-label"?: string;
  "aria-labelledby"?: string;
}

function Selector({ value, values, onSelect, ...ariaProps }: Props) {
  const onChange = useCallback(
    (e: React.MouseEvent<HTMLButtonElement, MouseEvent>, value: string) => {
      if (onSelect) {
        onSelect(value);
      }
    },
    [onSelect]
  );

  return (
    <Container role="group" {...ariaProps}>
      {values.map(option => {
        const isSelected = option.value === value;
        return (
          <Selection
            // Explicit type: inside a <form> a bare <button> defaults to "submit".
            type="button"
            onClick={e => onChange(e, option.value)}
            key={option.value}
            // Exposes the selected state to assistive tech, not just via color.
            aria-pressed={isSelected}
            data-selected={isSelected ? "true" : "false"}
          >
            {option.label}
          </Selection>
        );
      })}
    </Container>
  );
}

export default Selector;
