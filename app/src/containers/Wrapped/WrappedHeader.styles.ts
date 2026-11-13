import { styled } from "@linaria/react";

import { DEFAULT_LIST_COLOR } from "../../constants";
import { theme } from "../../theme";

import _Hamburger from "@components/Hamburger";

export const Hamburger = styled(_Hamburger)`
  &[hidden] {
    display: none;
  }
`;

// Mirrors the list Header so the Logo's rounded corner blends the same way.
export const Container = styled.header`
  grid-row: 3;
  grid-column: 1;
  background-color: var(--current-list-color, ${DEFAULT_LIST_COLOR});
  background-image: linear-gradient(transparent, rgba(0, 0, 0, 0.2));
  box-shadow:
    inset 0 -1px rgba(0, 0, 0, 0.3),
    0 2px 3px rgba(0, 0, 0, 0.3);
  color: #1f1f1f;
  display: flex;
  align-items: center;
  padding: 0 0.8rem 0 0;
  overflow: hidden;
  z-index: var(--z-header);
  transition: background 0.6s;
  &[data-dark-color="true"] {
    color: #fff;
  }
  ${Hamburger} {
    padding: 0 0.5rem 0 0.8rem;
  }
  ${theme.queries.medium} {
    grid-row: 1;
    grid-column: 2;
    ${Hamburger} {
      display: none;
    }
  }
`;

export const Title = styled.h2`
  flex: 1;
  font-size: 1.8rem;
  text-shadow: 1px 1px 3px rgba(0, 0, 0, 0.5);
  text-align: center;
  white-space: nowrap;
  text-overflow: ellipsis;
  overflow: hidden;
  line-height: 4rem;
  margin: 0;
`;
