import { styled } from "@linaria/react";

import { Input as FormInput } from "@components/Forms";

export const Input = styled(FormInput)`
  margin: 0;
  border-radius: 50px;
`;

export const Container = styled.form`
  padding: 1rem 1rem 0.8rem;
  &[data-hidden="true"] {
    margin-bottom: 1rem;
    padding: 0;
    ${Input} {
      display: none;
    }
  }
  &[data-absolute="true"] {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    z-index: 1;
  }
`;
