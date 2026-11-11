import { styled } from "@linaria/react";

import { theme } from "../../../theme";

// Smart list icons are drawn white for the nav, so give them the nav's backdrop here too.
export const ListIcon = styled.div`
  width: 2rem;
  height: 2rem;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 0.5rem;
  color: #fff;
  text-align: center;
  background: ${theme.colors.navigation.background};
`;
