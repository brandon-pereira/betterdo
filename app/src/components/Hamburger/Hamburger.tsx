import { styled } from "@linaria/react";

import useCurrentListId from "@hooks/useCurrentListId";
import useLists from "@hooks/useLists";
import useSwipe from "@hooks/useSwipe";
import useSwitchList from "@hooks/useSwitchList";
import { getListSlug } from "@utilities/customLists";

import { NAVIGATION_ID } from "../../constants";

const Bar = styled.div`
  height: 4px;
  width: 100%;
  background: currentColor;
  border-radius: 3px;
  transition:
    transform 0.4s,
    opacity 0.2s;
  &:nth-of-type(1) {
    transform-origin: top left;
  }
  &:nth-of-type(3) {
    transform-origin: bottom left;
  }
`;

const ClickContainer = styled.button`
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  border: none;
  background: none;
  color: inherit;
  font: inherit;
  cursor: pointer;
  &:focus-visible {
    outline: 2px solid currentColor;
    outline-offset: -2px;
    border-radius: 4px;
  }
`;

const BarContainer = styled.div`
  flex-direction: column;
  justify-content: space-between;
  height: 1.5rem;
  width: 2rem;
  filter: drop-shadow(0 1px rgba(0, 0, 0, 0.5));
  display: flex;
  &[data-open="true"] {
    ${Bar}:nth-of-type(1) {
      transform: rotate(45deg);
    }
    ${Bar}:nth-of-type(2) {
      opacity: 0;
    }
    ${Bar}:nth-of-type(3) {
      transform: rotate(-45deg);
    }
  }
`;

interface Props {
  className?: string;
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
  open: boolean;
  hidden?: boolean;
  label: string;
}

const Hamburger = ({ open, className, onClick, hidden, label }: Props) => {
  const { lists } = useLists();
  const currentListId = useCurrentListId();
  const switchList = useSwitchList();
  const currentListIndex = lists.findIndex(l => l.id === currentListId || getListSlug(l) === currentListId);
  const nextList = currentListIndex + 1 < lists.length ? lists[currentListIndex + 1] : lists[0];
  const prevList = currentListIndex - 1 >= 0 ? lists[currentListIndex - 1] : lists[lists.length - 1];
  const swiper = useSwipe({
    onSwipedLeft: () => switchList(nextList),
    onSwipedRight: () => switchList(prevList)
  });

  return (
    <ClickContainer
      type="button"
      aria-label={label}
      aria-expanded={open}
      aria-controls={NAVIGATION_ID}
      onClick={onClick}
      className={className}
      hidden={hidden}
      {...swiper}
    >
      <BarContainer aria-hidden="true" data-open={open ? "true" : "false"}>
        <Bar />
        <Bar />
        <Bar />
      </BarContainer>
    </ClickContainer>
  );
};

export default Hamburger;
