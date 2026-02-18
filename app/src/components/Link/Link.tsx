import React from "react";
import { Anchor, type AnchorProps } from "@mantine/core";
import { Link as RouterLink, type LinkProps } from "react-router-dom";

type Props = AnchorProps & Omit<LinkProps, "to"> & { to: LinkProps["to"] };

const Link = React.forwardRef<HTMLAnchorElement, Props>(({ to, ...props }, ref) => (
  <Anchor component={RouterLink} to={to} ref={ref} {...props} fw={600} />
));

Link.displayName = "Link";

export default Link;
