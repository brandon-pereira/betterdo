import WebNotifier from "web-notifier";
import MongoDbAdapter from "web-notifier/dist/adapters/MongoDbAdapter";
import { InternalRouter } from "./helpers/routeHandler";

interface DefaultNotificationFormat {
  title: string;
  body?: string;
  icon?: string;
  url?: string;
  tag?: string;
  data?: {
    listId: string;
    listTitle: string;
  };
}
type Notifier = WebNotifier<DefaultNotificationFormat>;
export { Notifier };

export default ({ db }: InternalRouter) => {
  const getUserPushSubscriptions = async (userId: string) => {
    const user = await db.Users.findById(userId);
    if (user && user.isPushEnabled) {
      return user.pushSubscriptions;
    }
    return [];
  };

  const removeUserPushSubscription = async (
    userId: string,
    subscription: string,
  ) => {
    const user = await db.Users.findById(userId);
    if (!user) return;
    const index = user.pushSubscriptions.indexOf(subscription);
    if (index !== -1) {
      user.pushSubscriptions.splice(index, 1);
    }
    await user.save();
    return;
  };

  const notifier = new WebNotifier<DefaultNotificationFormat>({
    vapidKeys: {
      publicKey: process.env.VAPID_PUBLIC_KEY || "",
      privateKey: process.env.VAPID_PRIVATE_KEY || "",
      email: process.env.VAPID_EMAIL || "",
    },
    notificationDefaults: {
      icon: `${process.env.SERVER_URL}/app/android-chrome-192x192.png`,
      url: `${process.env.SERVER_URL}/app`,
    },
    getUserPushSubscriptions,
    removeUserPushSubscription,
    adapter: new MongoDbAdapter(),
  });

  return notifier;
};
