import WebNotifier from "web-notifier";
import InMemoryAdapter from "web-notifier/dist/adapters/InMemoryAdapter.js";
import { eq, and } from "drizzle-orm";
import { db } from "./db.js";
import { user, pushSubscriptions } from "./schema/auth.js";
import config from "./config.js";

interface NotificationPayload {
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

type Notifier = WebNotifier<NotificationPayload>;
export type { Notifier, NotificationPayload };

export default function createNotifier(): Notifier {
  const getUserPushSubscriptions = async (userId: string): Promise<string[]> => {
    const result = await db.query.user.findFirst({
      where: eq(user.id, userId)
    });
    if (!result || !result.isPushEnabled) {
      return [];
    }
    const subs = await db.query.pushSubscriptions.findMany({
      where: eq(pushSubscriptions.userId, userId)
    });
    return subs.map(s => s.endpoint);
  };

  const removeUserPushSubscription = async (userId: string, subscription: string): Promise<void> => {
    await db
      .delete(pushSubscriptions)
      .where(and(eq(pushSubscriptions.userId, userId), eq(pushSubscriptions.endpoint, subscription)));
  };

  const notifier = new WebNotifier<NotificationPayload>({
    vapidKeys: {
      publicKey: config.VAPID_PUBLIC_KEY || "",
      privateKey: config.VAPID_PRIVATE_KEY || "",
      email: config.VAPID_EMAIL || ""
    },
    notificationDefaults: {
      icon: `${config.SERVER_URL || ""}/icon-192x192.png`,
      url: `${config.SERVER_URL || ""}/app`
    },
    getUserPushSubscriptions,
    removeUserPushSubscription,
    adapter: new InMemoryAdapter()
  });

  return notifier;
}
