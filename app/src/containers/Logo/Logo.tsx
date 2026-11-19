import { Container, Content, Hamburger, SyncSlot } from "./Logo.styles";

import SyncStatus from "@components/SyncStatus";
import useHamburgerNav from "@hooks/useHamburgerNav";

function Logo() {
  const [isMobileNavVisible, setMobileNavVisibility] = useHamburgerNav();

  return (
    <Container>
      <Content>
        <Hamburger
          label="Close navigation"
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
        <SyncSlot>
          <SyncStatus />
        </SyncSlot>
      </Content>
    </Container>
  );
}

export default Logo;
