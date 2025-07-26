import List from "./list";

interface User {
  id: string;
  firstName: string;
  lastName?: string;
  email: string;
  profilePicture: string;
  settings?: UserSettings;
  lastLogin: Date;
  creationDate: Date;
}

interface UserSettings {
  customLists: {
    highPriority?: boolean;
    today?: boolean;
    tomorrow?: boolean;
    overdue?: boolean;
    week?: boolean;
  };
  isBeta: boolean;
  isPushEnabled: boolean;
  timeZone: string;
  config: {
    vapidKey: string;
  };
}

// This is what should be sent to modifyProfile function
export interface UpdateUserObject extends Partial<User> {
  lists?: List[];
  pushSubscription?: string;
}

// modifyProfile function should format UpdateUserObject to match this schema
export interface _UpdateUserPayload extends Partial<User> {
  lists?: string[];
  pushSubscription?: string;
}

export default User;
