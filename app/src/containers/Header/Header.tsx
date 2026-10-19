import { Container, Hamburger, Loader, Title, SettingsButton, Icon } from "./Header.styles";

import Settings from "@components/Icon/svgs/settings.svg";
import useEditListModal from "@hooks/useEditListModal";
import useListDetails from "@hooks/useListDetails";
import useCurrentListId from "@hooks/useCurrentListId";
import useHamburgerNav from "@hooks/useHamburgerNav";
import useChromeColor from "@hooks/useChromeColor";

function Header() {
  const [isMobileNavVisible, setMobileNavVisibility] = useHamburgerNav();
  // Match the background the Header actually renders (Container writes
  // listColor to --current-list-color), so the text color stays legible.
  const { isListColorDark: isDarkColor } = useChromeColor();

  const { openModal: openEditListModal } = useEditListModal();
  const currentListId = useCurrentListId();
  const { list, loading } = useListDetails(currentListId);

  return (
    <Container data-dark-color={isDarkColor ? "true" : "false"}>
      <Hamburger open={isMobileNavVisible} hidden={isMobileNavVisible} onClick={() => setMobileNavVisibility(true)} />
      <Loader isVisible={loading} size="2rem" />
      <Title>{list.title}</Title>
      <SettingsButton
        aria-label="List Settings"
        color="none"
        hidden={list.type !== "default"}
        onClick={openEditListModal}
      >
        <Icon icon={Settings} color={"currentColor"} />
      </SettingsButton>
    </Container>
  );
}

export default Header;
