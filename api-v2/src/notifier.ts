import { createRequire } from "module";
import { eq, and } from "drizzle-orm";
import { db } from "./db.js";
import { pushSubscriptions } from "./schema/notification.js";
import config from "./config.js";
import DrizzleNotificationAdapter from "./helpers/drizzleNotificationAdapter.js";

const require = createRequire(import.meta.url);
const WebNotifier = require("web-notifier").default as typeof import("web-notifier").default;

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

type Notifier = InstanceType<typeof WebNotifier<NotificationPayload>>;
export type { Notifier };

function createNotifier(): Notifier {
  const getUserPushSubscriptions = async (userId: string): Promise<string[]> => {
    const result = await db.query.user.findFirst({
      where: { id: userId }
    });
    if (!result || !result.isPushEnabled) {
      return [];
    }
    const subs = await db.query.pushSubscriptions.findMany({
      where: { userId }
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
    adapter: new DrizzleNotificationAdapter<NotificationPayload>()
  });

  return notifier;
}

// Shared singleton so routes/services can import the notifier directly without
// threading it through Hono context. Created lazily on first access.
let notifierInstance: Notifier | null = null;

export function getNotifier(): Notifier {
  if (!notifierInstance) {
    notifierInstance = createNotifier();
  }
  return notifierInstance;
}
