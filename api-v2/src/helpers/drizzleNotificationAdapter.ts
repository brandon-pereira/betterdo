import { eq, lte } from "drizzle-orm";
import { db } from "../db.js";
import { scheduledNotifications } from "../schema/notification.js";

// Mirrors web-notifier's Adapter<NotificationFormat, NotificationIdFormat>
// interface (see web-notifier/dist/adapters/CoreAdapter). It is only exercised
// by `notifier.schedule` (delayed notifications); immediate `notifier.send`
// bypasses the adapter entirely.
interface QueuedNotification<NotificationFormat> {
  id: string;
  date: Date;
  userId: string;
  payload: NotificationFormat;
}

interface NotificationAdapter<NotificationFormat> {
  scheduleNotification(date: Date, userId: string, payload: NotificationFormat): Promise<void>;
  fetchNotifications(date: Date): Promise<QueuedNotification<NotificationFormat>[]>;
  clearNotification(id: string): Promise<boolean>;
}

/**
 * Persists scheduled notifications in Postgres via Drizzle so the queue
 * survives process restarts (unlike the InMemoryAdapter). The scheduler polls
 * `fetchNotifications` every 5s and calls `clearNotification` once a row is sent.
 */
export default class DrizzleNotificationAdapter<NotificationFormat> implements NotificationAdapter<NotificationFormat> {
  async scheduleNotification(date: Date, userId: string, payload: NotificationFormat): Promise<void> {
    await db.insert(scheduledNotifications).values({
      userId,
      date,
      payload
    });
  }

  async fetchNotifications(date: Date): Promise<QueuedNotification<NotificationFormat>[]> {
    const rows = await db.select().from(scheduledNotifications).where(lte(scheduledNotifications.date, date));

    return rows.map(row => ({
      id: row.id,
      date: row.date,
      userId: row.userId,
      payload: row.payload as NotificationFormat
    }));
  }

  async clearNotification(id: string): Promise<boolean> {
    const deleted = await db
      .delete(scheduledNotifications)
      .where(eq(scheduledNotifications.id, id))
      .returning({ id: scheduledNotifications.id });

    return deleted.length > 0;
  }
}
