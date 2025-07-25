import React from "react";
import { Container, LogoSection, BrandTitle, FormSection, FormWrapper, Title } from "./Auth.styles";
import BetterDoLogo from "@components/Icon/svgs/betterdo.svg";
import { Link } from "react-router-dom";

const AuthContainer = ({ children, title }: { children: React.ReactNode; title: string }) => {
  return (
    <Container>
      <BrandTitle>
        <Link to="/">
          Better<span>Do.</span>
        </Link>
      </BrandTitle>
      <LogoSection>
        <BetterDoLogo />
      </LogoSection>

      <FormSection>
        <FormWrapper>
          <Title>{title}</Title>
          {children}
        </FormWrapper>
      </FormSection>
    </Container>
  );
};

export default AuthContainer;
