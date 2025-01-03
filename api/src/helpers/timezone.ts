export function timezone(date: Date, timeZone: string): Date {
    return new Date(date.toLocaleString('en-US', { timeZone }));
}
