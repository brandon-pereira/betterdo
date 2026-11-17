import { styled } from "@linaria/react";

import { theme } from "../../theme";
import { DEFAULT_LIST_COLOR } from "../../constants";

import _Hamburger from "@components/Hamburger";

export const Container = styled.div`
  background-image: linear-gradient(transparent, rgba(0, 0, 0, 0.2));
  background-color: var(--current-list-color, ${DEFAULT_LIST_COLOR});
  position: relative;
  grid-row: 1;
  grid-column: 1;
  z-index: var(--z-logo);
  transition: background 0.6s;
  ${theme.queries.medium} {
    transform: none;
    grid-row: 1 / 1;
    grid-column: 1 / 1;
  }
`;

export const Hamburger = styled(_Hamburger)``;
// Reserves the status icon's space so the title doesn't move when it appears.
// On mobile the header shows the status instead (this bar is usually collapsed).
export const SyncSlot = styled.div`
  flex-shrink: 0;
  width: 2rem;
  display: flex;
  justify-content: center;
  visibility: hidden;
  ${theme.queries.medium} {
    visibility: visible;
  }
`;

export const Content = styled.div`
  height: 100%;
  box-sizing: border-box;
  overflow: hidden;
  cursor: pointer;
  background: linear-gradient(transparent, rgba(0, 0, 0, 0.3)), ${theme.colors.navigation.background};
  border: none;
  box-shadow: inset 0 -1px rgba(0, 0, 0, 0.9);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: space-between;
  position: relative;
  padding: 0 1rem;
  h1 {
    margin: 0;
    font-size: 1.8rem;
    font-weight: 200;
  }
  span {
    font-weight: 600;
  }
  ${theme.queries.medium} {
    border-radius: 0 30px 0 0;
    box-shadow:
      1px 0 ${theme.colors.navigation.border},
      0 1px 5px rgba(0, 0, 0, 0.9);
    transform: none;
    padding: 0 0.5rem;
    h1 {
      font-size: 1.2rem;
      margin-right: 0.2rem;
    }
    ${Hamburger} {
      display: none;
    }
  }
  ${theme.queries.large} {
    h1 {
      font-size: 1.8rem;
      margin-right: 1rem;
    }
  }
`;
