import { lazy, Suspense, useCallback } from "react";
import { arrayMoveImmutable } from "array-move";
import { Container, ListScroller, NavigationModalOverlay, ListsContainer } from "./Navigation.styles";
import useLists from "@hooks/useLists";
import useModifyProfile from "@hooks/useModifyProfile";
import useHamburgerNav from "@hooks/useHamburgerNav";
import { NewListItem } from "@components/ListItem";
import Scroller from "@components/Scroller";
import Loader from "@components/Loader";

const SortableList = lazy(() => import("./SortableList"));

function Navigation() {
  const [isMobileNavVisible, setMobileNavVisibility] = useHamburgerNav();
  const modifyProfile = useModifyProfile();
  const { lists } = useLists();

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
    <Container $isMobileNavVisible={isMobileNavVisible}>
      <ListScroller>
        <ListsContainer>
          <Suspense fallback={<Loader />}>
            <SortableList lists={lists} onSortEnd={onSortEnd} />
          </Suspense>
          <NewListItem />
        </ListsContainer>
      </ListScroller>
      <NavigationModalOverlay onClick={() => setMobileNavVisibility(false)} />
    </Container>
  );
}

export default Navigation;
