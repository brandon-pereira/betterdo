import { styled } from "styled-components";

export const Container = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  grid-template-rows: auto 1fr;
  gap: 2rem;
  width: 100%;
  height: 100%;
  background: #fcfcfc;
  background: ${({ theme }) => theme.colors.modals.listViewAlternateBackground};
  ${({ theme }) => theme.queries.medium} {
    grid-template-columns: 1fr 1fr;
    grid-template-rows: 1fr;
    gap: 4rem;
  }
`;

export const LogoSection = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  box-shadow:
    inset -5px 0 rgba(0, 0, 0, 0.1),
    1px 0 0px rgba(0, 0, 0, 1);
  background: linear-gradient(
    -45deg,
    ${({ theme }) => theme.colors.general.blue},
    color-mix(in srgb, ${({ theme }) => theme.colors.general.blue}, #000)
  );

  path {
    stroke-width: 1px;
    fill: rgba(255, 255, 255, 0.2);
    stroke: #000;
    stroke-width: 0px;
  }

  svg {
    width: 30rem;
    height: 30rem;
    margin-bottom: 1rem;
    filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.3));
  }
`;

export const BrandTitle = styled.h1`
  position: absolute;
  top: 1rem;
  left: 1rem;
  color: #fff;
  font-size: 2.5rem;
  font-weight: 300;
  margin: 0;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  a {
    color: inherit;
  }
  span {
    font-weight: 600;
  }
`;

export const FormSection = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
`;

export const FormWrapper = styled.div`
  background: ${({ theme }) => theme.colors.modals.contentBackground};

  border-radius: 1rem;
  padding: 2rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 400px;

  form {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }
`;

export const Title = styled.h2`
  color: ${({ theme }) => theme.colors.body.color};
  font-size: 1.5rem;
  font-weight: 400;
  margin: 0 0 1.5rem 0;
  text-align: center;
`;

export const ErrorMessage = styled.div`
  background: ${({ theme }) => theme.colors.general.red};
  color: white;
  padding: 0.75rem 1rem;
  border-radius: 0.5rem;
  font-size: 0.9rem;
  margin-bottom: 1rem;
  text-align: center;
`;
