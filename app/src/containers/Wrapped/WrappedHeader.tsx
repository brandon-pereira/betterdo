import { Container, Hamburger, Title } from "./WrappedHeader.styles";

import useHamburgerNav from "@hooks/useHamburgerNav";
import useChromeColor from "@hooks/useChromeColor";

function WrappedHeader() {
  const [isMobileNavVisible, setMobileNavVisibility] = useHamburgerNav();
  const { isListColorDark } = useChromeColor();

  return (
    <Container data-dark-color={isListColorDark ? "true" : "false"}>
      <Hamburger open={isMobileNavVisible} hidden={isMobileNavVisible} onClick={() => setMobileNavVisibility(true)} />
      <Title>Wrapped</Title>
    </Container>
  );
}

export default WrappedHeader;
