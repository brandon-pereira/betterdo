import { styled } from "@linaria/react";

import { theme } from "../../../theme";

export const OptionGroup = styled.div`
  display: flex;
  border-radius: 1rem;
  align-items: center;
  padding: 1rem;
  margin: 0 -1rem;
  &:first-of-type {
    padding-top: 0.5rem;
  }
  &:nth-of-type(even) {
    background: ${theme.colors.modals.listViewAlternateBackground};
  }
  select {
    max-width: 15rem;
  }
  > div {
    flex: 1;
    margin-right: 1rem;
  }
`;

export const Description = styled.p`
  margin-top: -0.2rem;
  font-size: 0.9rem;
  color: ${theme.colors.body.color};
`;
