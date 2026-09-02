import type { Notifier } from "../notifier.js";

const BASE_URL = process.env.APP_URL || "";

interface ListWithMembers {
  id: string;
  title: string;
  members: { id: string }[];
}

interface NotifyContext {
  notifier: Notifier;
  user: { id: string; name: string };
}

export function notifyAboutSharedList(title: string, list: ListWithMembers, { notifier, user }: NotifyContext): void {
  const members = list.members;
  const listId = list.id;
  const isSharedList = members.length > 1;

  if (isSharedList) {
    members.forEach(async member => {
      if (member.id !== user.id) {
        await notifier.send(member.id, {
          title,
          url: `${BASE_URL}/#/${listId}`,
          tag: `shared-list:${listId}`,
          data: {
            listId,
            listTitle: list.title
          }
        });
      }
    });
  }
}
