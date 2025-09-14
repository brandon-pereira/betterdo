import { styled } from "styled-components";

const StyledDivider = styled.div`
  width: 100%;
  height: 1px;
  background-color: var(--text-color);
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 1rem 0;
`;

const DividerText = styled.span`
  font-size: 0.8rem;
  background-color: var(--background-color);
  color: var(--text-color);
  padding: 0 1rem;
`;

export default function Divider({
  text,
  textColor,
  backgroundColor
}: {
  text?: string;
  textColor?: string;
  backgroundColor?: string;
}) {
  return (
    <StyledDivider style={{ "--background-color": backgroundColor, "--text-color": textColor } as React.CSSProperties}>
      {text && <DividerText>{text}</DividerText>}
    </StyledDivider>
  );
}
