import { Link as RouterLink } from "react-router-dom";

import { StyledLink } from "./Link.styles";

const Link = ({ children, ...props }: React.ComponentProps<typeof RouterLink>) => (
  <StyledLink {...props}>{children}</StyledLink>
);

export default Link;
