import { styled } from "@linaria/react";

export const Loader = styled.div<{
  $size?: string;
  $color: string | undefined;
}>`
  @keyframes loader-rotate {
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(270deg);
    }
  }
  @keyframes loader-dashoffset {
    0% {
      stroke-dashoffset: 184;
    }
    50% {
      stroke-dashoffset: 46;
      transform: rotate(135deg);
    }
    100% {
      stroke-dashoffset: 184;
      transform: rotate(450deg);
    }
  }
  height: 0;
  width: 0;
  transform: scale(0);
  opacity: 0;
  transition: all 0.5s 0.2s;
  position: relative;
  svg {
    position: absolute;
    top: 0;
    left: 0;
    height: 100%;
    width: 100%;
    animation: loader-rotate 2s linear infinite;
  }

  svg circle {
    stroke-width: 5px;
    stroke-dasharray: 184;
    stroke-dashoffset: 0;
    transform-origin: center;
    stroke: ${props => props.$color || "#fff"};
    animation: loader-dashoffset 2s linear infinite;
  }

  &[data-visible="true"] {
    transition:
      all 0s 0s,
      width 0.2s !important;
    transform: scale(1);
    opacity: 1;
    height: ${props => props.$size || "1rem"};
    width: ${props => props.$size || "1rem"};
  }
`;
