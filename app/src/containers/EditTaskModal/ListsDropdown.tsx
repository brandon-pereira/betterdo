import Dropdown from "@components/Dropdown";
import useLists from "@hooks/useLists";

interface Props {
  currentListId?: string;
  onSelect: (newList: string) => void;
  id?: string;
}

function ListsDropdown({ currentListId, onSelect, id }: Props) {
  const { lists } = useLists();
  const formattedLists = lists
    .filter(list => list.type === "default" || list.type === "inbox")
    .map(list => ({
      value: list.id,
      label: list.title
    }));

  return <Dropdown id={id} values={formattedLists} onSelect={onSelect} value={currentListId} />;
}

export default ListsDropdown;
