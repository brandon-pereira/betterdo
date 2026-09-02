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
    try {
      const rows = await db.select().from(scheduledNotifications).where(lte(scheduledNotifications.date, date));

      return rows.map(row => ({
        id: row.id,
        date: row.date,
        userId: row.userId,
        payload: row.payload as NotificationFormat
      }));
    } catch (err) {
      // web-notifier's scheduler polls this every 5s with no error handling, so
      // any rejection here becomes an unhandled rejection and crashes the
      // process (e.g. when Postgres isn't up yet at boot). Swallow the error and
      // return an empty queue; the next poll retries once the DB is reachable.
      console.error(
        "[notifier] fetchNotifications failed, retrying next poll:",
        err instanceof Error ? err.message : err
      );
      return [];
    }
  }

  async clearNotification(id: string): Promise<boolean> {
    const deleted = await db
      .delete(scheduledNotifications)
      .where(eq(scheduledNotifications.id, id))
      .returning({ id: scheduledNotifications.id });

    return deleted.length > 0;
  }
}
