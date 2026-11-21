interface Props {
  day: number;
  size?: string;
  strokeWidth?: number;
}

// Lucide's calendar outline with the day of the month drawn inside, so it matches the other list icons.
function CalendarDayIcon({ day, size = "1rem", strokeWidth = 2 }: Props) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M8 2v4" />
      <path d="M16 2v4" />
      <rect width="18" height="18" x="3" y="4" rx="2" />
      <text
        x="12"
        y="18.6"
        fill="currentColor"
        stroke="none"
        fontSize="11.5"
        fontWeight="600"
        letterSpacing="-0.4"
        textAnchor="middle"
        style={{ fontVariantNumeric: "tabular-nums" }}
      >
        {day}
      </text>
    </svg>
  );
}

export default CalendarDayIcon;
