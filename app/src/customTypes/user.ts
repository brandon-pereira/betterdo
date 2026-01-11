import List from "./list";

interface User {
  id: string;
  firstName: string;
  lastName?: string;
  email: string;
  profilePicture?: string | null;
  lastLogin: Date;
  creationDate: Date;
  isBeta?: boolean;
  isPushEnabled?: boolean | null;
  timeZone: string;
  customLists?: CustomLists;
}

interface CustomLists {
  highPriority?: boolean;
  today?: boolean;
  tomorrow?: boolean;
  overdue?: boolean;
  week?: boolean;
}
// interface UserSettings {
//   customLists: {
//     highPriority?: boolean;
//     today?: boolean;
//     tomorrow?: boolean;
//     overdue?: boolean;
//     week?: boolean;
//   };
//   isBeta: boolean;
//   isPushEnabled: boolean;
//   timeZone: string;
//   config: {
//     vapidKey: string;
//   };
// }

// This is what should be sent to modifyProfile function
export interface UpdateUserObject
  extends Partial<
    Pick<User, "firstName" | "lastName" | "profilePicture" | "isBeta" | "isPushEnabled" | "timeZone" | "customLists">
  > {
  lists?: List[];
  pushSubscription?: string;
}

// modifyProfile function should format UpdateUserObject to match this schema
export interface _UpdateUserPayload extends Partial<User> {
  lists?: string[];
  pushSubscription?: string;
}

export default User;
