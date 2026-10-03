import { styled } from "@linaria/react";
import { Link as RouterLink } from "react-router-dom";

import { theme } from "../../theme";

export const StyledLink = styled(RouterLink)`
  color: ${theme.colors.general.blue};
  font-weight: 600;
  text-decoration: none;

  &:hover {
    text-decoration: underline;
  }

  &:focus-visible {
    outline: 2px solid ${theme.colors.general.blue};
    outline-offset: 2px;
    border-radius: 2px;
  }
`;
