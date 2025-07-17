import { ObjectId } from "mongoose";
import { throwError } from "../helpers/errorHandler";
import { RouterOptions } from "../helpers/routeHandler";
import { User, UserDocument } from "../schemas/users";

export async function updateUser(
  dirtyUserProps: Partial<User> = {},
  { user, notifier }: RouterOptions
): Promise<UserDocument> {
  // Remove potentially harmful stuff
  let didUpdatePushSubscription = false;
  if (dirtyUserProps.pushSubscription && typeof dirtyUserProps.pushSubscription === "string") {
    if (!user.pushSubscriptions.includes(dirtyUserProps.pushSubscription)) {
      didUpdatePushSubscription = true;
      user.pushSubscriptions.push(dirtyUserProps.pushSubscription);
    }
  }
  // Ensure tasks length matches and no new tasks injected
  if (
    dirtyUserProps.lists &&
    (!Array.isArray(dirtyUserProps.lists) ||
      dirtyUserProps.lists.length !== user.lists.length ||
      dirtyUserProps.lists.find(_id => !user.lists.map(id => id.toString()).includes(_id)))
  ) {
    throwError("Invalid modification of lists");
  } else if (dirtyUserProps.lists) {
    // Valid tasks, update order
    user.lists = dirtyUserProps.lists;
    // Don't merge below
    delete dirtyUserProps.lists;
  }
  // if (typeof dirtyUserProps.isBeta === 'boolean') {
  //     userRef.isBeta = dirtyUserProps.isBeta;
  // }
  if (typeof dirtyUserProps.isPushEnabled === "boolean" && dirtyUserProps.isPushEnabled !== user.isPushEnabled) {
    didUpdatePushSubscription = true;
    user.isPushEnabled = dirtyUserProps.isPushEnabled;
  }
  if (dirtyUserProps.customLists && typeof dirtyUserProps.customLists === "object") {
    Object.assign(user.customLists, dirtyUserProps.customLists);
  }
  const stringsToCheck = ["firstName", "lastName", "email", "timeZone"];
  stringsToCheck.forEach(id => {
    const idx = `${id}` as keyof User;
    if (
      dirtyUserProps[idx] &&
      user[idx] &&
      typeof dirtyUserProps[idx] === "string" &&
      typeof user[idx] !== "undefined"
    ) {
      //https://stackoverflow.com/a/58657194/7033335
      user[idx] = dirtyUserProps[idx] as never;
    }
  });
  // Save
  await user.save();
  // Send push notification
  if (didUpdatePushSubscription) {
    await notifier.send(user._id, {
      title: "You're subscribed!",
      body: "We'll notify you with updates!"
    });
  }
  // Return to front-end
  return user;
}

export async function getCurrentUser({ user }: RouterOptions): Promise<CurrentUser> {
  if (user) {
    return sanitizeCurrentUser(user);
  } else {
    throwError("Not Authenticated");
  }
}

export async function getUser(email: string, { db }: RouterOptions): Promise<OtherUser> {
  const user = await db.Users.findOne({ email: email });
  if (user) {
    return sanitizeOtherUser(user);
  } else {
    throwError("Invalid User Email");
  }
}

interface OtherUser {
  _id: ObjectId;
  firstName?: string;
  lastName?: string;
  email: string;
  profilePicture?: string;
}

interface CurrentUser extends OtherUser {
  customLists: User["customLists"];
  isBeta: User["isBeta"];
  isPushEnabled: User["isPushEnabled"];
  lastLogin: User["lastLogin"];
  timeZone: User["timeZone"];
  creationDate: User["creationDate"];
  config: { [key: string]: string | undefined };
}

function sanitizeCurrentUser(user: UserDocument): CurrentUser {
  // All the "otherUser" data plus additional
  const otherUser = sanitizeOtherUser(user);
  return {
    ...otherUser,
    customLists: user.customLists,
    isBeta: user.isBeta,
    isPushEnabled: user.isPushEnabled,
    lastLogin: user.lastLogin,
    creationDate: user.creationDate,
    lastName: user.lastName,
    timeZone: user.timeZone,
    config: {
      vapidKey: process.env.VAPID_PUBLIC_KEY
    }
  };
}

function sanitizeOtherUser(user: UserDocument): OtherUser {
  return {
    _id: user._id,
    firstName: user.firstName,
    lastName: user.lastName ? user.lastName.charAt(0) : undefined,
    email: user.email,
    profilePicture: user.profilePicture
  };
}
