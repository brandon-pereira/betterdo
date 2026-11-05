import { timezone } from "./timezone.js";

// Due dates are stored as server-local midnight of the user's calendar day
// (see routes/tasks.ts and the custom "today"/"tomorrow" lists, which compare
// against `startOfDay(timezone(now, user.timeZone))`). These helpers convert
// between that representation and a plain `YYYY-MM-DD` calendar date, which is
// what non-browser clients (e.g. MCP) naturally send and expect.

const pad = (value: number) => String(value).padStart(2, "0");

const toCalendarDate = (date: Date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

export function calendarDateToDueDate(calendarDate: string): Date {
  const [year, month, day] = calendarDate.split("-").map(Number);
  return new Date(year, month - 1, day);
}

export function dueDateToCalendarDate(dueDate: Date | null | undefined): string | null {
  return dueDate ? toCalendarDate(dueDate) : null;
}

export function todayForTimeZone(timeZone: string): string {
  return toCalendarDate(timezone(new Date(), timeZone));
}
