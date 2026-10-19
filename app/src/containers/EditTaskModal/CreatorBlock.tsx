import { CreatorBlock, CreatorDetails, ProfilePic, CreationDate } from "./EditTask.styles";
import RelativeTime from "./RelativeTime";

import User from "@customTypes/user";

interface Props {
  createdBy: User;
  creationDate: string;
}

function _CreatorBlock({ createdBy, creationDate }: Props) {
  if (!createdBy) {
    return null;
  }
  return (
    <CreatorBlock>
      <ProfilePic user={createdBy} />
      <CreatorDetails>
        Created by{" "}
        <strong>
          {createdBy.firstName} {createdBy.lastName}
        </strong>
        <CreationDate>
          Created{" "}
          <strong>
            <RelativeTime date={new Date(creationDate)} />
          </strong>
        </CreationDate>
      </CreatorDetails>
    </CreatorBlock>
  );
}

export default _CreatorBlock;
