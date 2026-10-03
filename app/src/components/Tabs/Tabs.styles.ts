import { styled } from "@linaria/react";
import { motion } from "framer-motion";

import { theme } from "../../theme";

export const Container = styled.div``;
export const TabsHeader = styled.div`
  position: relative;
  list-style: none;
  display: flex;
  margin: 0;
  padding: 0;
  border: 2px solid var(--tab-color, ${theme.colors.general.blue});
  border-radius: 3px;
  margin-bottom: 1rem;
  overflow-x: auto;
`;
export const ActiveTabHeaderBackground = styled(motion.div)`
  position: absolute;
  z-index: -1;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
  background-color: var(--tab-color, ${theme.colors.general.blue});
`;
export const TabHeaderItem = styled.button`
  border: none;
  background: none;
  font: inherit;
  white-space: nowrap;
  flex: 1;
  text-align: center;
  position: relative;
  border-right: 1px solid var(--tab-color, ${theme.colors.general.blue});
  padding: 0.6rem 0.4rem;
  cursor: pointer;
  color: var(--tab-color, ${theme.colors.general.blue});
  outline: none;
  &[data-selected="true"] {
    color: #fff;
    cursor: default;
  }
  &:focus-visible {
    text-decoration: underline;
  }
  &:last-of-type {
    border-right: none;
  }
`;

export const TabsBody = styled.div``;
export const TabBodyItem = styled.div`
  display: none;
  &[data-selected="true"] {
    display: block;
  }
`;
