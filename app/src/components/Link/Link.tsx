import React from "react";
import { type LinkProps } from "react-router-dom";
import { StyledLink } from "./Link.styles";

type Props = Omit<LinkProps, "to"> & { to: LinkProps["to"] };

const Link = React.forwardRef<HTMLAnchorElement, Props>((props, ref) => <StyledLink ref={ref} {...props} />);

Link.displayName = "Link";

export default Link;
