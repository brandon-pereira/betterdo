import { useId, useState } from "react";
import type { ReactNode } from "react";

import {
  AccordionItem,
  AccordionPanel,
  AccordionTrigger,
  RowBody,
  RowDescription,
  RowText,
  RowTitle
} from "./Settings.styles";

import Chevron from "@components/Icon/svgs/chevron.svg";

interface Props {
  title: string;
  summary?: ReactNode;
  defaultOpen?: boolean;
  children: ReactNode;
}

function Accordion({ title, summary, defaultOpen = false, children }: Props) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const panelId = useId();

  return (
    <AccordionItem>
      <AccordionTrigger
        type="button"
        aria-expanded={isOpen}
        aria-controls={panelId}
        onClick={() => setIsOpen(open => !open)}
      >
        <RowText>
          <RowTitle>{title}</RowTitle>
          {summary && <RowDescription>{summary}</RowDescription>}
        </RowText>
        <Chevron aria-hidden="true" />
      </AccordionTrigger>
      <AccordionPanel id={panelId} data-open={isOpen ? "true" : "false"}>
        <div>
          <RowBody>{children}</RowBody>
        </div>
      </AccordionPanel>
    </AccordionItem>
  );
}

export default Accordion;
