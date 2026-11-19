import { Container, Hamburger, Loader, Title, SettingsButton, Icon } from "./Header.styles";

import Settings from "@components/Icon/svgs/settings.svg";
import Tooltip from "@components/Tooltip";
import useEditListModal from "@hooks/useEditListModal";
import useListDetails from "@hooks/useListDetails";
import useCurrentListId from "@hooks/useCurrentListId";
import useHamburgerNav from "@hooks/useHamburgerNav";
import useChromeColor from "@hooks/useChromeColor";

interface Props {
  // Replaces the current list's title on pages that aren't a list (e.g. Wrapped),
  // which also hides the list's loader and settings button.
  title?: string;
}

function Header({ title }: Props) {
  const [isMobileNavVisible, setMobileNavVisibility] = useHamburgerNav();
  // Match the background the Header actually renders (Container writes
  // listColor to --current-list-color), so the text color stays legible.
  const { isListColorDark: isDarkColor } = useChromeColor();

  const { openModal: openEditListModal } = useEditListModal();
  const currentListId = useCurrentListId();
  const { list, loading } = useListDetails(currentListId);

  return (
    <Container data-dark-color={isDarkColor ? "true" : "false"}>
      <Hamburger
        label="Open navigation"
        open={isMobileNavVisible}
        hidden={isMobileNavVisible}
        onClick={() => setMobileNavVisibility(true)}
      />
      <Loader isVisible={!title && loading} size="2rem" />
      <Title>{title ?? list.title}</Title>
      <Tooltip label="List settings" placement="bottom">
        <SettingsButton
          aria-label="List settings"
          color="none"
          hidden={Boolean(title) || list.type !== "default"}
          onClick={openEditListModal}
        >
          <Icon icon={Settings} color={"currentColor"} />
        </SettingsButton>
      </Tooltip>
    </Container>
  );
}

export default Header;
