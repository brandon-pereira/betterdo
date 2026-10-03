import { styled } from "@linaria/react";

import { theme } from "../../theme";

export const _Container = styled.div`
  width: 100vw;
  height: 100vh;
  display: grid;
  grid-template-columns: 1fr 0;
  grid-template-rows: 0 0 4rem 1fr;
  transition:
    grid-template-columns 0.2s,
    grid-template-rows 0.2s;
  &[data-mobile-nav="true"] {
    grid-template-columns: 1fr 0;
    grid-template-rows: 4rem 60vh 4rem 1fr;
  }
  ${theme.queries.medium} {
    grid-template-columns: 10rem 1fr;
    grid-template-rows: 4rem 1fr 0 0;
  }
  ${theme.queries.large} {
    grid-template-columns: 14rem 1fr;
  }
`;
