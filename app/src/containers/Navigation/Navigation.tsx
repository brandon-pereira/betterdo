import { lazy, Suspense, useCallback } from "react";
import { arrayMoveImmutable } from "array-move";
import { useNavigate } from "react-router-dom";

import {
  Container,
  Footer,
  ListScroller,
  NavigationModalOverlay,
  ListsContainer,
  ProfilePicture,
  FooterActions,
  FooterButton
} from "./Navigation.styles";
import useLists from "@hooks/useLists";
import useModifyProfile from "@hooks/useModifyProfile";
import useHamburgerNav from "@hooks/useHamburgerNav";
import useNavHover from "@hooks/useNavHover";
import { NewListItem, NAV_ITEM_TRANSITION, SelectedItemBackground } from "@components/ListItem";
import useIsWrappedPage from "@hooks/useIsWrappedPage";
import Loader from "@components/Loader";
import Tooltip from "@components/Tooltip";
import { ChartColumn as Recap, Settings } from "lucide-react";
import useProfile from "@hooks/useProfile";
import useGeneratedUrl from "@hooks/useGeneratedUrl";

// Started eagerly so the chunk downloads in parallel with the initial fetches.
const sortableListImport = import("./SortableList");
const SortableList = lazy(() => sortableListImport);

function Navigation() {
  const [isMobileNavVisible, setMobileNavVisibility] = useHamburgerNav();
  const [, setHoveredId] = useNavHover();
  const modifyProfile = useModifyProfile();
  const { lists } = useLists();
  const { profile } = useProfile();
  const isWrappedPage = useIsWrappedPage();
  const navigate = useNavigate();
  const generateUrl = useGeneratedUrl();

  const onSortEnd = useCallback(
    ({ oldIndex, newIndex }: { oldIndex: number; newIndex: number }) => {
      // Indexes match, no change
      if (oldIndex === newIndex) {
        return;
      }
      try {
        modifyProfile({
          lists: arrayMoveImmutable(lists, oldIndex, newIndex)
        });
      } catch (err) {
        console.error(err);
      }
    },
    [lists, modifyProfile]
  );

  return (
    <Container data-mobile-nav={isMobileNavVisible ? "true" : "false"}>
      <ListScroller>
        <ListsContainer onPointerLeave={() => setHoveredId(null)}>
          <Suspense fallback={<Loader />}>
            <SortableList lists={lists} onSortEnd={onSortEnd} />
          </Suspense>
          <NewListItem />
        </ListsContainer>
        <Footer>
          <Tooltip label="Account settings">
            <ProfilePicture
              user={profile}
              size="2.4rem"
              aria-label="Account settings"
              onClick={() => navigate(generateUrl("/profile-settings/account"))}
            />
          </Tooltip>
          <FooterActions>
            <Tooltip label="Your recap">
              <FooterButton
                type="button"
                aria-label="Your recap"
                data-selected={isWrappedPage ? "true" : "false"}
                aria-current={isWrappedPage ? "page" : undefined}
                onClick={() => {
                  setMobileNavVisibility(false);
                  navigate("/wrapped");
                }}
              >
                {isWrappedPage && (
                  <SelectedItemBackground layoutId="primary-nav-selected-div" transition={NAV_ITEM_TRANSITION} />
                )}
                <Recap size={20} aria-hidden />
              </FooterButton>
            </Tooltip>
            <Tooltip label="Settings">
              <FooterButton
                type="button"
                aria-label="Settings"
                onClick={() => navigate(generateUrl("/profile-settings/preferences"))}
              >
                <Settings size={20} aria-hidden />
              </FooterButton>
            </Tooltip>
          </FooterActions>
        </Footer>
      </ListScroller>

      <NavigationModalOverlay onClick={() => setMobileNavVisibility(false)} />
    </Container>
  );
}

export default Navigation;
