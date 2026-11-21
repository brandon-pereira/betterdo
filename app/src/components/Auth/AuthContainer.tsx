import React from "react";
import { Container, LogoSection, BrandTitle, FormSection, FormWrapper, Title } from "./Auth.styles";
import BetterDoLogo from "@components/Icon/svgs/betterdo.svg";
import { Link } from "react-router-dom";
import useDarkMode from "@hooks/useDarkMode";
import useThemeColor from "@hooks/useThemeColor";
import { DARK_VARS, LIGHT_VARS } from "../../theme";

const AuthContainer = ({ children, title }: { children: React.ReactNode; title: string }) => {
  const [isDarkMode] = useDarkMode();
  // Blend the browser chrome (e.g. the macOS Safari toolbar) into the page background.
  useThemeColor((isDarkMode ? DARK_VARS : LIGHT_VARS)["colors-body-background"]);

  return (
    <Container>
      <FormSection>
        <FormWrapper>
          <Title>{title}</Title>
          {children}
        </FormWrapper>
      </FormSection>
      <BrandTitle>
        <Link to="/">
          Better<span>Do.</span>
        </Link>
      </BrandTitle>
      <LogoSection>
        <BetterDoLogo />
      </LogoSection>
    </Container>
  );
};

export default AuthContainer;
