import { styled } from "@linaria/react";

import { theme } from "../../theme";

import _ProfilePicture from "@components/ProfilePic";
import { SelectedItemBackground } from "@components/ListItem";

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
  z-index: var(--z-navigation-mobile);
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
    z-index: var(--z-navigation);
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

export const Footer = styled.div`
  display: flex;
  position: sticky;
  bottom: 0;
  z-index: 9;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  padding: 0.6rem 1rem;
  border-top: 1px solid ${theme.colors.navigation.divider};
  background: rgba(0, 0, 0, 0.05);
  backdrop-filter: blur(10px);
  ${theme.queries.medium} {
    padding: 0.6rem 0.75rem;
  }
`;

export const ProfilePicture = styled(_ProfilePicture)`
  flex-shrink: 0;
`;

export const FooterActions = styled.div`
  display: flex;
  align-items: center;
  gap: 0.25rem;
`;

export const FooterButton = styled.button`
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.5rem;
  border: none;
  border-radius: 50%;
  background: transparent;
  color: rgba(255, 255, 255, 0.8);
  cursor: pointer;
  transition:
    color 0.15s,
    background 0.15s;
  &:hover {
    color: #fff;
    background: ${theme.colors.navigation.hover};
  }
  &:focus-visible {
    outline: 2px solid ${theme.colors.general.blue};
    outline-offset: 1px;
  }
  &[data-selected="true"] {
    color: #fff;
  }
  svg {
    position: relative;
  }
  ${SelectedItemBackground} {
    border-radius: 50%;
  }
`;
