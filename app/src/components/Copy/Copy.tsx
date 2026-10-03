import { styled } from "@linaria/react";
import type { CSSProperties, ReactNode } from "react";

import { theme } from "../../theme";

const StyledHeader = styled.h2`
  color: var(--accent-color, ${theme.colors.general.blue});
  font-weight: 100;
  font-size: 2rem;
  margin: 0 0 1rem;
  padding: 0;
  letter-spacing: -2px;
`;

interface HeaderProps extends React.HTMLAttributes<HTMLHeadingElement> {
  color?: string;
  children?: ReactNode;
}

const Header = ({ color, style, ...props }: HeaderProps) => (
  <StyledHeader style={color ? ({ "--accent-color": color, ...style } as CSSProperties) : style} {...props} />
);

const Body = styled.p`
  color: ${theme.colors.body.color};
  margin: 0 0 1rem;
`;

export { Header, Body };
