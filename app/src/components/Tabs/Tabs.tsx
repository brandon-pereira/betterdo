import { LayoutGroup } from "framer-motion";
import { cloneElement, Children } from "react";
import type { CSSProperties } from "react";

import { Container, TabsBody, TabBodyItem, TabsHeader, ActiveTabHeaderBackground, TabHeaderItem } from "./Tabs.styles";

interface Props {
  selectedIndex?: number;
  onChange: (num: number) => void;
  color?: string;
  children: React.ReactElement[];
  titles: string[];
}
function Tabs({ selectedIndex, onChange, color, children, titles }: Props) {
  const colorStyle = color ? ({ "--tab-color": color } as CSSProperties) : undefined;
  return (
    <Container>
      <LayoutGroup>
        <TabsHeader style={colorStyle}>
          {titles.map((title, index) => (
            <TabHeaderItem
              key={index}
              data-selected={selectedIndex === index ? "true" : "false"}
              onClick={() => onChange(index)}
              style={colorStyle}
            >
              {title}
              {selectedIndex === index && (
                <ActiveTabHeaderBackground style={colorStyle} layout layoutId="active-tab" inherit={false} />
              )}
            </TabHeaderItem>
          ))}
        </TabsHeader>
      </LayoutGroup>
      <TabsBody>
        {Children.map(children, (value, index) => {
          return cloneElement(value as React.ReactElement<{ "data-selected"?: string }>, {
            "data-selected": index === selectedIndex ? "true" : "false"
          });
        })}
      </TabsBody>
    </Container>
  );
}

export const Tab = TabBodyItem;
export default Tabs;
