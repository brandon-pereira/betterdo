import { sql } from "drizzle-orm";
import { db } from "../db.js";
import { completedByUser, toLocalTime } from "./taskQueries.js";

/**
 * "BetterDo Wrapped" — a monthly, yearly or all-time Spotify-Wrapped-style
 * summary of a user's activity, computed entirely from the tasks table.
 *
 * Timezone handling: `tasks.created_at` and `tasks.completed_at` are stored as
 * UTC in `timestamp` (no tz) columns. To bucket by the user's local day / hour
 * we convert with `AT TIME ZONE 'UTC' AT TIME ZONE <userTz>`.
 *
 * Completion timing: `completed_at` was backfilled from `created_at` for
 * historical tasks and is stamped going forward on the incomplete -> complete
 * transition (see services/tasks.ts). For most stats we bucket on `created_at`
 * (always accurate); the monthly "completed" graph uses `completed_at`.
 */

export type WrappedPeriod =
  | { type: "month"; year: number; month: number } // month is 1-12
  | { type: "year"; year: number }
  | { type: "all-time" };

export interface WrappedSummary {
  // URL key for the period: "2026-10", "2026" or "all-time".
  period: string;
  periodType: WrappedPeriod["type"];
  // The period's year, or the current year for all-time.
  year: number;
  // 1-12 for a month, null otherwise.
  month: number | null;
  timeZone: string;
  totals: {
    created: number;
    // Tasks the user completed during the period, whenever they were created.
    completed: number;
    // Share (0-100) of the tasks created in the period that are now done.
    completionRate: number;
    activeDays: number;
    // Days in the period so far: up to today for the current month/year, the full
    // length for past ones, or days since the first task for all-time.
    daysInPeriod: number;
    avgPerDay: number;
    avgPerActiveDay: number;
    // Growth vs the previous month/year. Null for all-time (no prior period).
    createdPreviousPeriod: number;
    growthPct: number | null;
  };
  // Created/completed counts bucketed by day (month), month (year) or year
  // (all-time). `label` is for display ("1"…"31", "Jan"…"Dec", "2018"…"2026");
  // `key` is the raw day, month or year number.
  breakdown: { key: number; label: string; created: number; completed: number }[];
  // Longest run of consecutive days. `added` uses created_at (days a task was
  // created); `completed` uses completed_at (days a task was finished). Note:
  // completed_at was backfilled from created_at for historical tasks, so the two
  // can be identical for older periods.
  longestStreak: {
    added: { length: number; start: string | null; end: string | null };
    completed: { length: number; start: string | null; end: string | null };
  };
  busiestDay: { date: string; count: number } | null;
  byWeekday: { weekday: number; count: number }[];
  byHour: { hour: number; count: number }[];
  topTasks: { title: string; count: number }[];
  topLists: { title: string; color: string; count: number }[];
  // First task of the period (first of the month/year, or first ever for all-time).
  firstTask: { title: string; createdAt: string } | null;
}

interface WrappedArgs {
  userId: string;
  period: WrappedPeriod;
  timeZone: string;
}

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// Parses a URL key ("2026-10", "2026" or "all-time") into a period.
export function parseWrappedPeriod(key: string): WrappedPeriod | null {
  if (key === "all-time") {
    return { type: "all-time" };
  }
  const match = /^(\d{4})(?:-(\d{2}))?$/.exec(key);
  if (!match) {
    return null;
  }
  const year = Number(match[1]);
  if (year < 2000 || year > 2100) {
    return null;
  }
  if (match[2] === undefined) {
    return { type: "year", year };
  }
  const month = Number(match[2]);
  return month >= 1 && month <= 12 ? { type: "month", year, month } : null;
}

const toDateString = (year: number, month: number) => `${year}-${String(month).padStart(2, "0")}-01`;

// [start, end) of the period and of the one before it, as YYYY-MM-DD local dates.
function getPeriodRange(period: Exclude<WrappedPeriod, { type: "all-time" }>) {
  if (period.type === "year") {
    return {
      start: toDateString(period.year, 1),
      end: toDateString(period.year + 1, 1),
      previousStart: toDateString(period.year - 1, 1)
    };
  }
  const { year, month } = period;
  return {
    start: toDateString(year, month),
    end: month === 12 ? toDateString(year + 1, 1) : toDateString(year, month + 1),
    previousStart: month === 1 ? toDateString(year - 1, 12) : toDateString(year, month - 1)
  };
}

function getPeriodKey(period: WrappedPeriod) {
  if (period.type === "all-time") {
    return "all-time";
  }
  return period.type === "year" ? String(period.year) : toDateString(period.year, period.month).slice(0, 7);
}

export async function getWrapped({ userId, period, timeZone }: WrappedArgs): Promise<WrappedSummary> {
  const isAllTime = period.type === "all-time";
  const year = isAllTime ? new Date().getFullYear() : period.year;

  // All-time has no range; these are only read when !isAllTime.
  const { start, end, previousStart } = isAllTime ? { start: "", end: "", previousStart: "" } : getPeriodRange(period);

  // Local-time conversion of a column, reused throughout.
  const local = (col: "created_at" | "completed_at") => toLocalTime(col, timeZone);

  // Scope predicate: for a year it's user + [start, end); for all-time it's just
  // the user (relies on the tasks_createdById_idx index for speed).
  const scope = isAllTime
    ? sql`created_by_id = ${userId}`
    : sql`created_by_id = ${userId}
        AND ${local("created_at")} >= ${start}
        AND ${local("created_at")} < ${end}`;

  // Same idea but for tasks the user completed within the period.
  const completedScope = isAllTime
    ? completedByUser(userId)
    : sql`${completedByUser(userId)}
        AND ${local("completed_at")} >= ${start}
        AND ${local("completed_at")} < ${end}`;

  const today = sql`(now() AT TIME ZONE ${timeZone})::date`;

  // 1. Totals (created / completed / active days) + the previous period's created count.
  const totalsRows = await db.execute<{
    created: number;
    completed: number;
    created_and_completed: number;
    active_days: number;
    prev_created: number;
    first_day: string | null;
    days_in_period: number | null;
  }>(sql`
    SELECT
      COUNT(*) FILTER (WHERE ${scope})::int AS created,
      COUNT(*) FILTER (WHERE ${completedScope})::int AS completed,
      COUNT(*) FILTER (WHERE ${scope} AND is_completed)::int AS created_and_completed,
      COUNT(DISTINCT (${local("created_at")}::date)) FILTER (WHERE ${scope})::int AS active_days,
      ${
        isAllTime
          ? sql`0::int`
          : sql`COUNT(*) FILTER (
              WHERE created_by_id = ${userId}
                AND ${local("created_at")} >= ${previousStart}
                AND ${local("created_at")} < ${start}
            )::int`
      } AS prev_created,
      MIN(${local("created_at")}::date) FILTER (WHERE ${scope})::text AS first_day,
      ${isAllTime ? sql`NULL::int` : sql`(LEAST(${end}::date, ${today} + 1) - ${start}::date)::int`} AS days_in_period
    FROM tasks
  `);
  const t = totalsRows.rows[0] ?? {
    created: 0,
    completed: 0,
    created_and_completed: 0,
    active_days: 0,
    prev_created: 0,
    first_day: null,
    days_in_period: null
  };

  // Days in period: elapsed days of a month/year (all of them once it's over), or
  // for all-time, days from the first task up to today (inclusive).
  let daysInPeriod: number;
  if (isAllTime) {
    const firstDay = t.first_day ? new Date(t.first_day) : new Date();
    daysInPeriod = Math.max(1, Math.round((Date.now() - firstDay.getTime()) / 86_400_000) + 1);
  } else {
    daysInPeriod = Math.max(1, t.days_in_period ?? 1);
  }

  // 2. Breakdown — by day within a month, by month within a year, or by year for all-time.
  const breakdown = isAllTime
    ? await (async () => {
        const rows = await db.execute<{ key: number; created: number; completed: number }>(sql`
          WITH years AS (
            SELECT generate_series(
              EXTRACT(YEAR FROM (SELECT MIN(${local("created_at")}) FROM tasks WHERE created_by_id = ${userId}))::int,
              EXTRACT(YEAR FROM now() AT TIME ZONE ${timeZone})::int
            ) AS key
          )
          SELECT
            y.key,
            COALESCE(c.created, 0)::int AS created,
            COALESCE(d.completed, 0)::int AS completed
          FROM years y
          LEFT JOIN (
            SELECT EXTRACT(YEAR FROM ${local("created_at")})::int AS key, COUNT(*)::int AS created
            FROM tasks WHERE created_by_id = ${userId} GROUP BY 1
          ) c ON c.key = y.key
          LEFT JOIN (
            SELECT EXTRACT(YEAR FROM ${local("completed_at")})::int AS key, COUNT(*)::int AS completed
            FROM tasks WHERE ${completedScope} GROUP BY 1
          ) d ON d.key = y.key
          ORDER BY y.key
        `);
        return rows.rows.map(r => ({ key: r.key, label: String(r.key), created: r.created, completed: r.completed }));
      })()
    : await (async () => {
        const isMonth = period.type === "month";
        const unit = sql.raw(isMonth ? "DAY" : "MONTH");
        const bucketCount = isMonth ? sql`EXTRACT(DAY FROM ${end}::date - 1)::int` : sql`12`;
        const rows = await db.execute<{ key: number; created: number; completed: number }>(sql`
          WITH buckets AS (SELECT generate_series(1, ${bucketCount}) AS key)
          SELECT
            b.key,
            COALESCE(c.created, 0)::int AS created,
            COALESCE(d.completed, 0)::int AS completed
          FROM buckets b
          LEFT JOIN (
            SELECT EXTRACT(${unit} FROM ${local("created_at")})::int AS key, COUNT(*)::int AS created
            FROM tasks WHERE ${scope} GROUP BY 1
          ) c ON c.key = b.key
          LEFT JOIN (
            SELECT EXTRACT(${unit} FROM ${local("completed_at")})::int AS key, COUNT(*)::int AS completed
            FROM tasks WHERE ${completedScope} GROUP BY 1
          ) d ON d.key = b.key
          ORDER BY b.key
        `);
        return rows.rows.map(r => ({
          key: r.key,
          label: isMonth ? String(r.key) : (MONTH_NAMES[r.key - 1] ?? String(r.key)),
          created: r.created,
          completed: r.completed
        }));
      })();

  // 3. Longest streaks of consecutive active days (islands-and-gaps), one for
  // adding tasks (created_at) and one for completing them (completed_at).
  const streakQuery = (col: "created_at" | "completed_at", pred: ReturnType<typeof sql>) =>
    db.execute<{ streak_start: string; streak_end: string; streak_len: number }>(sql`
      WITH days AS (
        SELECT DISTINCT (${local(col)}::date) AS d
        FROM tasks WHERE ${pred}
      ),
      grp AS (SELECT d, d - (ROW_NUMBER() OVER (ORDER BY d))::int AS g FROM days)
      SELECT MIN(d)::text AS streak_start, MAX(d)::text AS streak_end, COUNT(*)::int AS streak_len
      FROM grp GROUP BY g ORDER BY streak_len DESC LIMIT 1
    `);

  const [addedStreakRows, completedStreakRows] = await Promise.all([
    streakQuery("created_at", scope),
    streakQuery("completed_at", completedScope)
  ]);
  const addedStreak = addedStreakRows.rows[0];
  const completedStreak = completedStreakRows.rows[0];

  // 4. Busiest single day.
  const busiestRows = await db.execute<{ day: string; n: number }>(sql`
    SELECT (${local("created_at")}::date)::text AS day, COUNT(*)::int AS n
    FROM tasks WHERE ${scope}
    GROUP BY 1 ORDER BY n DESC, day ASC LIMIT 1
  `);
  const busiest = busiestRows.rows[0];

  // 5. By weekday (0 = Sunday) and 6. by hour (0-23), local time.
  const weekdayRows = await db.execute<{ weekday: number; count: number }>(sql`
    SELECT EXTRACT(DOW FROM ${local("created_at")})::int AS weekday, COUNT(*)::int AS count
    FROM tasks WHERE ${scope}
    GROUP BY 1 ORDER BY 1
  `);
  const hourRows = await db.execute<{ hour: number; count: number }>(sql`
    SELECT EXTRACT(HOUR FROM ${local("created_at")})::int AS hour, COUNT(*)::int AS count
    FROM tasks WHERE ${scope}
    GROUP BY 1 ORDER BY 1
  `);

  // 7. Most-created tasks by normalized title.
  const topTaskRows = await db.execute<{ title: string; count: number }>(sql`
    SELECT lower(trim(title)) AS title, COUNT(*)::int AS count
    FROM tasks WHERE ${scope}
    GROUP BY 1 HAVING COUNT(*) > 1
    ORDER BY count DESC, title ASC LIMIT 10
  `);

  // 8. Top lists by volume.
  const topListRows = await db.execute<{ title: string; color: string; count: number }>(sql`
    SELECT l.title, l.color, COUNT(t.id)::int AS count
    FROM tasks t JOIN list l ON l.id = t.list_id
    WHERE ${
      isAllTime
        ? sql`t.created_by_id = ${userId}`
        : sql`t.created_by_id = ${userId}
            AND (t.created_at AT TIME ZONE 'UTC' AT TIME ZONE ${timeZone}) >= ${start}
            AND (t.created_at AT TIME ZONE 'UTC' AT TIME ZONE ${timeZone}) < ${end}`
    }
    GROUP BY l.title, l.color ORDER BY count DESC LIMIT 8
  `);

  // 9. First task of the period — the first of the month/year, or the first ever for all-time.
  const firstRows = await db.execute<{ title: string; created_at: string }>(sql`
    SELECT title, (${local("created_at")})::text AS created_at
    FROM tasks WHERE ${scope}
    ORDER BY created_at ASC LIMIT 1
  `);
  const first = firstRows.rows[0];

  const created = t.created ?? 0;
  const activeDays = t.active_days ?? 0;
  const prevCreated = t.prev_created ?? 0;

  return {
    period: getPeriodKey(period),
    periodType: period.type,
    year,
    month: period.type === "month" ? period.month : null,
    timeZone,
    totals: {
      created,
      completed: t.completed ?? 0,
      completionRate: created ? Math.round(((t.created_and_completed ?? 0) / created) * 100) : 0,
      activeDays,
      daysInPeriod,
      avgPerDay: round(created / daysInPeriod),
      avgPerActiveDay: activeDays ? round(created / activeDays) : 0,
      createdPreviousPeriod: prevCreated,
      growthPct: isAllTime || !prevCreated ? null : round(((created - prevCreated) / prevCreated) * 100)
    },
    breakdown,
    longestStreak: {
      added: addedStreak
        ? { length: addedStreak.streak_len, start: addedStreak.streak_start, end: addedStreak.streak_end }
        : { length: 0, start: null, end: null },
      completed: completedStreak
        ? { length: completedStreak.streak_len, start: completedStreak.streak_start, end: completedStreak.streak_end }
        : { length: 0, start: null, end: null }
    },
    busiestDay: busiest ? { date: busiest.day, count: busiest.n } : null,
    byWeekday: weekdayRows.rows,
    byHour: hourRows.rows,
    topTasks: topTaskRows.rows,
    topLists: topListRows.rows,
    firstTask: first ? { title: first.title, createdAt: first.created_at } : null
  };
}

function round(n: number): number {
  return Math.round(n * 100) / 100;
}
