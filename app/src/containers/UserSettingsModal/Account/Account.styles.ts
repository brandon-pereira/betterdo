import { styled } from "@linaria/react";

export const NameFields = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem;
  & label {
    margin-bottom: 0.35rem;
  }
  @media (max-width: 500px) {
    grid-template-columns: 1fr;
  }
`;
