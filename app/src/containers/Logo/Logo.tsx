import { Container, Content, Hamburger } from "./Logo.styles";

import useHamburgerNav from "@hooks/useHamburgerNav";

function Logo() {
  const [isMobileNavVisible, setMobileNavVisibility] = useHamburgerNav();
  return (
    <Container>
      <Content>
        <Hamburger
          open={isMobileNavVisible}
          onClick={e => {
            setMobileNavVisibility(false);
            e.stopPropagation();
          }}
        />
        <h1>
          Better
          <span>Do.</span>
        </h1>
      </Content>
    </Container>
  );
}

export default Logo;
