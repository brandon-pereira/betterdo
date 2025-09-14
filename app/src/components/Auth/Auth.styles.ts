import Button from "@components/Button";
import { styled } from "styled-components";

export const Container = styled.div`
  display: grid;
  grid-template-rows: 1fr;
  grid-template-columns: 1fr;
  gap: 2rem;
  width: 100%;
  height: 100%;
  padding-top: 7rem;

  background: ${({ theme }) => theme.colors.body.background};
  ${({ theme }) => theme.queries.large} {
    grid-template-columns: 1fr 1fr;
    gap: 2rem;
    padding-top: 0;
  }
`;

export const LogoSection = styled.div`
  display: flex;
  margin: 2rem 2rem 2rem 0;
  padding: 2rem;
  border-radius: 4rem;
  position: relative;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  box-shadow:
    inset 0 0 0 10px rgba(255, 255, 255, 0.05),
    0 0 2px rgba(0, 0, 0, 1);
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
    width: 75%;
    max-width: 30rem;
    height: auto;
    aspect-ratio: 1 / 1;
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

export const AuthButtons = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 1rem;
`;

export const MainButton = styled(Button)`
  span {
    flex: 1;
  }
`;

export const AuthProviders = styled.div`
  display: flex;
  gap: 1rem;
  button {
    flex: 1;
  }
`;

export const FormWrapper = styled.div`
  --background-color: ${({ theme }) => theme.colors.modals.contentBackground};
  background: var(--background-color);
  color: ${({ theme }) => theme.colors.body.color};
  border-radius: 1rem;
  padding: 2rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 400px;
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

export const Title = styled.h2`
  font-size: 2rem;
  font-weight: 500;
  text-align: center;
  margin: 0 0 1rem;
`;

export const OtherActionRibbon = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  margin-top: 1rem;
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
