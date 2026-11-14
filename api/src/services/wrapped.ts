import { sql } from "drizzle-orm";
import { db } from "../db.js";
import { completedByUser, toLocalTime } from "./taskQueries.js";
import type { WrappedPeriod } from "../validators/wrapped.js";

// "BetterDo Wrapped": a monthly, yearly or all-time summary of a user's activity.
// Note `completed_at` was backfilled from `created_at` for historical tasks, so
// older completion stats mirror creation dates.

export interface WrappedSummary {
  periodType: "month" | "year" | "all-time";
  // The period's year, or the current year for all-time.
  year: number;
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
  // Bucketed by day (month), month (year) or year (all-time). `key` is the raw
  // day/month/year number; `label` is for display.
  breakdown: { key: number; label: string; created: number; completed: number }[];
  // Longest runs of consecutive days with a task added / completed.
  longestStreak: {
    added: { length: number; start: string | null; end: string | null };
    completed: { length: number; start: string | null; end: string | null };
  };
  busiestDay: { date: string; count: number } | null;
  byWeekday: { weekday: number; count: number }[];
  byHour: { hour: number; count: number }[];
  topTasks: { title: string; count: number }[];
  topLists: { title: string; color: string; count: number }[];
  firstTask: { title: string; createdAt: string } | null;
}

interface WrappedArgs {
  userId: string;
  period: WrappedPeriod;
  timeZone: string;
}

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const toDateString = (year: number, month: number) => `${year}-${String(month).padStart(2, "0")}-01`;

// [start, end) of a month (or the whole year when month is undefined) and of the
// period before it, as YYYY-MM-DD local dates.
function getPeriodRange(year: number, month?: number) {
  if (month === undefined) {
    return {
      start: toDateString(year, 1),
      end: toDateString(year + 1, 1),
      previousStart: toDateString(year - 1, 1)
    };
  }
  return {
    start: toDateString(year, month),
    end: month === 12 ? toDateString(year + 1, 1) : toDateString(year, month + 1),
    previousStart: month === 1 ? toDateString(year - 1, 12) : toDateString(year, month - 1)
  };
}

export async function getWrapped({ userId, period, timeZone }: WrappedArgs): Promise<WrappedSummary> {
  const isAllTime = "all" in period;
  const year = (!isAllTime && period.year) || new Date().getFullYear();
  const month = isAllTime ? undefined : period.month;
  const periodType = isAllTime ? "all-time" : month ? "month" : "year";

  // All-time has no range; these are only read when !isAllTime.
  const { start, end, previousStart } = isAllTime
    ? { start: "", end: "", previousStart: "" }
    : getPeriodRange(year, month);

  const local = (col: "created_at" | "completed_at") => toLocalTime(col, timeZone);

  // Tasks the user created in the period (or ever, for all-time).
  const scope = isAllTime
    ? sql`created_by_id = ${userId}`
    : sql`created_by_id = ${userId}
        AND ${local("created_at")} >= ${start}
        AND ${local("created_at")} < ${end}`;

  // Tasks the user completed in the period.
  const completedScope = isAllTime
    ? completedByUser(userId)
    : sql`${completedByUser(userId)}
        AND ${local("completed_at")} >= ${start}
        AND ${local("completed_at")} < ${end}`;

  const today = sql`(now() AT TIME ZONE ${timeZone})::date`;

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

  let daysInPeriod: number;
  if (isAllTime) {
    const firstDay = t.first_day ? new Date(t.first_day) : new Date();
    daysInPeriod = Math.max(1, Math.round((Date.now() - firstDay.getTime()) / 86_400_000) + 1);
  } else {
    daysInPeriod = Math.max(1, t.days_in_period ?? 1);
  }

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
        const isMonth = periodType === "month";
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

  // Islands-and-gaps: consecutive dates share the same (date - row_number).
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

  const busiestRows = await db.execute<{ day: string; n: number }>(sql`
    SELECT (${local("created_at")}::date)::text AS day, COUNT(*)::int AS n
    FROM tasks WHERE ${scope}
    GROUP BY 1 ORDER BY n DESC, day ASC LIMIT 1
  `);
  const busiest = busiestRows.rows[0];

  // Weekday 0 is Sunday.
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

  // Most-created tasks, matching titles case- and whitespace-insensitively.
  const topTaskRows = await db.execute<{ title: string; count: number }>(sql`
    SELECT lower(trim(title)) AS title, COUNT(*)::int AS count
    FROM tasks WHERE ${scope}
    GROUP BY 1 HAVING COUNT(*) > 1
    ORDER BY count DESC, title ASC LIMIT 10
  `);

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
    periodType,
    year,
    month: month ?? null,
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
