import { forwardRef } from "react";

import {
  Container,
  DotIcon,
  Title,
  IconHolder,
  HoveredItemBackground,
  SelectedItemBackground,
  NAV_ITEM_TRANSITION
} from "./ListItem.styles";

import List from "@customTypes/list";
import customLists from "@utilities/customLists";
import useSwitchList from "@hooks/useSwitchList";
import useCurrentListId from "@hooks/useCurrentListId";
import useNavHover from "@hooks/useNavHover";

const getCustomList = (id: string) => {
  return customLists.find(list => list.id === id);
};

interface Props {
  containerProps: React.ButtonHTMLAttributes<HTMLButtonElement>;
  touchEvents: import("@dnd-kit/core").DraggableSyntheticListeners;
  list: List;
}

const ListItem = forwardRef<HTMLButtonElement, Props>(({ containerProps, touchEvents, list }, ref) => {
  const switchList = useSwitchList();
  const currentListId = useCurrentListId();
  const [hoveredId, setHoveredId] = useNavHover();
  const { type, color, id } = list;
  const selected = id === currentListId || (type !== "default" && type === currentListId);
  const customList = getCustomList(type);
  const Icon = customList?.icon || <DotIcon style={{ "--dot-color": color } as React.CSSProperties} />;
  const title = customList?.title || list.title;

  return (
    <Container
      data-selected={selected ? "true" : "false"}
      {...containerProps}
      style={{ ...containerProps.style, "--list-color": color } as React.CSSProperties}
      ref={ref}
      onClick={() => switchList(list)}
      onPointerEnter={() => setHoveredId(id)}
    >
      {hoveredId === id && (
        <HoveredItemBackground layoutId="primary-nav-hovered-div" transition={NAV_ITEM_TRANSITION} />
      )}
      {selected && <SelectedItemBackground layoutId="primary-nav-selected-div" transition={NAV_ITEM_TRANSITION} />}
      <IconHolder {...touchEvents}>{Icon}</IconHolder>
      <Title>{title}</Title>
    </Container>
  );
});

ListItem.displayName = "ListItem";

export default ListItem;
