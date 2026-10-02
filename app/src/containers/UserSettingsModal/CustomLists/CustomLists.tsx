import { useCallback } from "react";

import { CustomListsContainer, CustomListItem, Title, IconHolder } from "./CustomLists.styles";

import CUSTOM_LISTS from "@utilities/customLists";
import { Body } from "@components/Copy";
import { Error } from "@components/Forms";
import Toggle from "@components/Toggle";
import useProfile from "@hooks/useProfile";
import useModifyProfile from "@hooks/useModifyProfile";

function CustomListSettings() {
  const { profile, error } = useProfile();
  const modifyProfile = useModifyProfile();
  // The better-auth session (via useProfile) is the single source of truth.
  // We send only the toggled key; the server merges it into existing values, so
  // overlapping toggles can't clobber each other.
  const customLists = profile?.customLists ?? {};
  const onCustomListToggle = useCallback(
    async (id: string, bool: boolean) => {
      try {
        await modifyProfile({ customLists: { [id]: bool } });
      } catch (err) {
        console.error(err);
      }
    },
    [modifyProfile]
  );

  return (
    <>
      {error && <Error>{error}</Error>}
      <Body>Enable or disable custom lists to customize your BetterDo experience.</Body>
      <CustomListsContainer>
        {CUSTOM_LISTS.filter(list => !list.required).map(list => (
          <CustomListItem key={list.id}>
            <IconHolder>{list.icon}</IconHolder>
            <Title>{list.title}</Title>
            <Toggle
              onChange={(e, bool) => onCustomListToggle(list.id, bool)}
              value={customLists[list.id as keyof typeof customLists] || false}
            />
          </CustomListItem>
        ))}
      </CustomListsContainer>
    </>
  );
}

export default CustomListSettings;
