import { styled } from "@linaria/react";

import { theme } from "../../theme";

export const NavigationModalOverlay = styled.div`
  background: rgba(0, 0, 0, 0.5);
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  height: 1000px;
  opacity: 0;
`;

export const Container = styled.nav`
  display: flex;
  background: ${theme.colors.navigation.background};
  flex-direction: column;
  box-shadow:
    1px 0 ${theme.colors.navigation.border},
    0 1px 5px rgba(0, 0, 0, 0.9);
  position: relative;
  z-index: var(--z-navigation);
  grid-column: 1;
  grid-row: 2;
  max-height: 100%;
  pointer-events: none;
  &[data-mobile-nav="true"] {
    pointer-events: all;
    ${NavigationModalOverlay} {
      opacity: 1;
    }
  }
  ${theme.queries.medium} {
    display: flex;
    position: static;
    opacity: 1;
    grid-row: 2;
    grid-column: 1;
    pointer-events: all;
    transform: translateY(0%);
    overflow: hidden;
    ${NavigationModalOverlay} {
      display: none;
    }
  }
`;
export const ListsContainer = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
  flex: 1;
`;

export const ListScroller = styled.div`
  position: relative;
  overflow-x: hidden;
  width: 100%;
  height: 100%;
  flex: 1;
`;
