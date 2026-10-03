import { styled } from "@linaria/react";

import { theme } from "../../theme";

import _Banner from "@components/Banner";

const Banner = styled(_Banner)``;

export const Scroller = styled.div`
  position: relative;
  margin-bottom: 0.5rem;
  display: flex;
  flex-direction: column;
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  height: 100%;
`;

export const Container = styled.div`
  grid-row: 4;
  grid-column: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  background: ${theme.colors.body.background};
  ${theme.queries.medium} {
    grid-row: 2;
    grid-column: 2;
    ${Banner} {
      opacity: 1;
    }
  }
`;

export const TaskContainer = styled.div`
  margin: 0 1rem;
  text-align: center;
`;
