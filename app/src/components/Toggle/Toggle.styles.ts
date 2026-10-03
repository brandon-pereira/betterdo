import { styled } from "@linaria/react";

import { theme } from "../../theme";

export const Slider = styled.div`
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: ${theme.colors.general.red};
  transition: 0.4s;
  border-radius: 34px;
  &[data-disabled="true"] {
    cursor: not-allowed;
    background-color: #ccc !important;
  }
  &:before {
    position: absolute;
    content: "";
    height: 26px;
    width: 26px;
    left: 4px;
    bottom: 4px;
    background-color: white;
    transition: 0.4s;
    border-radius: 50%;
  }
`;
export const Switch = styled.label`
  position: relative;
  display: inline-block;
  width: 60px;
  height: 34px;
  outline: none;
  &[data-disabled="true"] {
    opacity: 0.2;
  }
  input {
    position: absolute;
    top: -99999px;
    left: -99999px;
    &:focus-visible + ${Slider}:before {
      background: ${theme.colors.general.blue};
      box-shadow: inset 0 0 0 3px #fff;
    }
    &:checked + ${Slider} {
      background-color: ${theme.colors.general.blue};
      &:before {
        transform: translateX(26px);
      }
    }
  }
`;
