import { styled } from "styled-components";

import _ProfilePic from "@components/ProfilePic";
import _Modal from "@components/Modal";

export const Modal = styled(_Modal)`
  position: absolute;
  transform: none;
  right: 0.75rem;
  top: 0.75rem;
  left: auto;
  bottom: 0.75rem;
  height: calc(100% - 1.5rem);
  width: calc(100% - 1.5rem);
  border-radius: 1.25rem;
  background: ${({ theme }) =>
    theme.isDarkMode
      ? "rgba(30, 30, 30, 0.7)"
      : "rgba(255, 255, 255, 0.65)"};
  backdrop-filter: blur(40px) saturate(1.8);
  -webkit-backdrop-filter: blur(40px) saturate(1.8);
  box-shadow:
    0 8px 32px rgba(0, 0, 0, 0.18),
    inset 0 0 0 1px
      ${({ theme }) =>
        theme.isDarkMode
          ? "rgba(255, 255, 255, 0.08)"
          : "rgba(255, 255, 255, 0.6)"},
    inset 0 1px 0
      ${({ theme }) =>
        theme.isDarkMode
          ? "rgba(255, 255, 255, 0.05)"
          : "rgba(255, 255, 255, 0.8)"};
  overflow: hidden;
  & > div {
    padding: 0;
    & > div {
      padding: 0;
    }
  }
  & [data-betterdo-modal-arrow] {
    display: none;
  }
`;

export const Container = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
`;
export const Block = styled.div`
  margin-bottom: 1rem;
`;
export const ProfilePic = styled(_ProfilePic)``;

export const HeaderBar = styled.div`
  position: sticky;
  top: 0;
  z-index: 2;
  padding: 0.75rem 1rem;
  margin: 0 -1rem 1rem;
  backdrop-filter: blur(20px) saturate(1.5);
  -webkit-backdrop-filter: blur(20px) saturate(1.5);
  background: ${({ theme }) =>
    theme.isDarkMode
      ? "rgba(30, 30, 30, 0.5)"
      : "rgba(255, 255, 255, 0.4)"};
  border-bottom: 1px solid
    ${({ theme }) =>
      theme.isDarkMode
        ? "rgba(255, 255, 255, 0.06)"
        : "rgba(0, 0, 0, 0.06)"};
`;

export const HeaderTitle = styled.span`
  font-size: 0.8rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: ${({ theme }) =>
    theme.isDarkMode
      ? "rgba(255, 255, 255, 0.5)"
      : "rgba(0, 0, 0, 0.4)"};
`;

export const Content = styled.div`
  flex: 1;
  padding: 0 1rem;
  overflow-y: auto;
  min-height: 0;
`;
export const CreatorBlock = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 0;
  background: ${({ theme }) =>
    theme.isDarkMode
      ? "rgba(255, 255, 255, 0.04)"
      : "rgba(0, 0, 0, 0.04)"};
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  box-shadow: inset 0 0 0 1px
    ${({ theme }) =>
      theme.isDarkMode
        ? "rgba(255, 255, 255, 0.08)"
        : "rgba(0, 0, 0, 0.08)"};
  padding: 1rem;
  border-radius: 0.75rem;
  ${({ theme }) =>
    theme.isDarkMode &&
    `
        color: ${theme.colors.body.color};
        `}
  ${ProfilePic} {
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
  }
  ${Block} {
    flex: 1;
    padding: 0 1rem;
  }
`;

export const LoaderContainer = styled.div`
  height: 100%;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
`;

export const ButtonContainer = styled.div`
  display: flex;
  justify-content: space-between;
  flex-shrink: 0;
  padding: 1rem;
  box-sizing: border-box;
  backdrop-filter: blur(20px) saturate(1.5);
  -webkit-backdrop-filter: blur(20px) saturate(1.5);
  background: ${({ theme }) =>
    theme.isDarkMode
      ? "rgba(20, 20, 20, 0.5)"
      : "rgba(255, 255, 255, 0.45)"};
  border-top: 1px solid
    ${({ theme }) =>
      theme.isDarkMode
        ? "rgba(255, 255, 255, 0.06)"
        : "rgba(255, 255, 255, 0.5)"};
`;
