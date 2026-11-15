import { styled } from "@linaria/react";

export const Badge = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  margin-right: 0.5rem;
  padding: 0.35rem 0.7rem;
  border-radius: 2rem;
  font-size: 1.2rem;
  font-weight: 600;
  line-height: 1;
  white-space: nowrap;
  user-select: none;
  color: currentColor;
  background-color: rgba(0, 0, 0, 0.18);
  border: 1px solid rgba(0, 0, 0, 0.2);
`;

export const Dot = styled.span`
  height: 0.7rem;
  width: 0.7rem;
  border-radius: 50%;
  background-color: #f0b429;
  &[data-offline="true"] {
    background-color: #e0533d;
  }
`;
