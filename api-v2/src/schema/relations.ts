import { defineRelations } from "drizzle-orm";
import * as authSchema from "./auth.js";
import * as taskSchema from "./task.js";
import * as listSchema from "./list.js";

const schema = {
  ...authSchema,
  ...taskSchema,
  ...listSchema
};

export const relations = defineRelations(schema, r => ({
  user: {
    sessions: r.many.session(),
    accounts: r.many.account(),
    passkeys: r.many.passkey(),
    pushSubscriptions: r.many.pushSubscriptions()
  },
  session: {
    user: r.one.user({
      from: r.session.userId,
      to: r.user.id
    })
  },
  account: {
    user: r.one.user({
      from: r.account.userId,
      to: r.user.id
    })
  },
  passkey: {
    user: r.one.user({
      from: r.passkey.userId,
      to: r.user.id
    })
  },
  pushSubscriptions: {
    user: r.one.user({
      from: r.pushSubscriptions.userId,
      to: r.user.id
    })
  },
  lists: {
    createdBy: r.one.user({
      from: r.lists.createdById,
      to: r.user.id
    }),
    members: r.many.listMembers()
  },
  listMembers: {
    list: r.one.lists({
      from: r.listMembers.listId,
      to: r.lists.id,
      optional: false
    }),
    user: r.one.user({
      from: r.listMembers.userId,
      to: r.user.id,
      optional: false
    })
  },
  tasks: {
    list: r.one.lists({
      from: r.tasks.listId,
      to: r.lists.id
    }),
    createdBy: r.one.user({
      from: r.tasks.createdById,
      to: r.user.id
    })
  }
}));
