// Wrapped periods are addressed by URL keys, matching the API:
// a month ("2026-10"), a year ("2026") or "all-time".

export type WrappedPeriodType = "month" | "year" | "all-time";

interface WrappedPeriod {
  type: WrappedPeriodType;
  year: number;
  // 1-12, only meaningful for months.
  month: number;
}

const pad = (month: number) => String(month).padStart(2, "0");

export function parsePeriodKey(key: string | undefined): WrappedPeriod | null {
  if (key === "all-time") {
    const now = new Date();
    return { type: "all-time", year: now.getFullYear(), month: now.getMonth() + 1 };
  }
  const match = /^(\d{4})(?:-(\d{2}))?$/.exec(key ?? "");
  if (!match) {
    return null;
  }
  const year = Number(match[1]);
  const month = match[2] === undefined ? 1 : Number(match[2]);
  if (month < 1 || month > 12) {
    return null;
  }
  return { type: match[2] === undefined ? "year" : "month", year, month };
}

export function toPeriodKey({ type, year, month }: WrappedPeriod): string {
  if (type === "all-time") {
    return "all-time";
  }
  return type === "year" ? String(year) : `${year}-${pad(month)}`;
}

export function getCurrentPeriodKey(type: WrappedPeriodType = "month"): string {
  const now = new Date();
  return toPeriodKey({ type, year: now.getFullYear(), month: now.getMonth() + 1 });
}

// The month or year `offset` steps away (negative goes back in time).
export function shiftPeriodKey(key: string, offset: number): string {
  const period = parsePeriodKey(key);
  if (!period || period.type === "all-time") {
    return key;
  }
  if (period.type === "year") {
    return toPeriodKey({ ...period, year: period.year + offset });
  }
  const monthIndex = period.year * 12 + (period.month - 1) + offset;
  return toPeriodKey({ type: "month", year: Math.floor(monthIndex / 12), month: (monthIndex % 12) + 1 });
}

// "October 2026", "2026" or "All time".
export function formatPeriod(key: string): string {
  const period = parsePeriodKey(key);
  if (!period) {
    return "";
  }
  if (period.type === "all-time") {
    return "All time";
  }
  if (period.type === "year") {
    return String(period.year);
  }
  return new Date(period.year, period.month - 1, 1).toLocaleDateString(undefined, { month: "long", year: "numeric" });
}

const RECAP_ANNOUNCEMENT_DAYS = 7;

// The recap to announce during the first week of a month: last month's, or in
// January, last year's. Null outside that window or if the account is newer
// than the period.
export function getReadyRecapKey(accountCreatedAt: Date | string | undefined, now = new Date()): string | null {
  if (!accountCreatedAt || now.getDate() > RECAP_ANNOUNCEMENT_DAYS) {
    return null;
  }
  const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  if (new Date(accountCreatedAt) >= currentMonthStart) {
    return null;
  }
  const currentMonthKey = toPeriodKey({ type: "month", year: now.getFullYear(), month: now.getMonth() + 1 });
  return now.getMonth() === 0 ? String(now.getFullYear() - 1) : shiftPeriodKey(currentMonthKey, -1);
}

// First moment of the period in local time; used to stop paging before the account existed.
export function getPeriodStart(key: string): Date | null {
  const period = parsePeriodKey(key);
  if (!period || period.type === "all-time") {
    return null;
  }
  return new Date(period.year, period.type === "year" ? 0 : period.month - 1, 1);
}
