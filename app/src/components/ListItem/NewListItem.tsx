import { forwardRef } from "react";

import { Container, Title, IconHolder, HoveredItemBackground, NAV_ITEM_TRANSITION } from "./ListItem.styles";

import customLists from "@utilities/customLists";
import useNewListModal from "@hooks/useNewListModal";
import useNavHover from "@hooks/useNavHover";

const NEW_LIST_HOVER_ID = "newList";

const getCustomList = (id: string) => {
  return customLists.find(list => list.id === id);
};

const ListItem = forwardRef<HTMLButtonElement>((props, ref) => {
  const { openModal: openNewListModal } = useNewListModal();
  const [hoveredId, setHoveredId] = useNavHover();
  const customList = getCustomList("newList");
  const Icon = customList?.icon;
  const title = customList?.title;

  return (
    <Container
      ref={ref}
      data-betterdo-newlist
      onClick={openNewListModal}
      onPointerEnter={() => setHoveredId(NEW_LIST_HOVER_ID)}
    >
      {hoveredId === NEW_LIST_HOVER_ID && (
        <HoveredItemBackground layoutId="primary-nav-hovered-div" transition={NAV_ITEM_TRANSITION} />
      )}
      <IconHolder>{Icon}</IconHolder>
      <Title>{title}</Title>
    </Container>
  );
});

ListItem.displayName = "ListItem";

export default ListItem;
