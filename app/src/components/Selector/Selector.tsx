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
}

function Selector({ value, values, onSelect }: Props) {
  const onChange = useCallback(
    (e: React.MouseEvent<HTMLButtonElement, MouseEvent>, value: string) => {
      if (onSelect) {
        onSelect(value);
      }
    },
    [onSelect]
  );

  return (
    <Container>
      {values.map(option => (
        <Selection
          onClick={e => onChange(e, option.value)}
          key={option.value}
          data-selected={option.value === value ? "true" : "false"}
        >
          {option.label}
        </Selection>
      ))}
    </Container>
  );
}

export default Selector;
