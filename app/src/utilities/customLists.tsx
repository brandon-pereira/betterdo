import { startOfToday, startOfTomorrow } from "date-fns";

import { AlarmClock, Bookmark, CalendarDays, Feather, Inbox } from "lucide-react";
import SvgIcon from "@components/Icon";
import CalendarDayIcon from "@components/CalendarDayIcon";

const ListItemIcon = ({
  icon
}: {
  icon: React.FunctionComponent<React.SVGAttributes<SVGElement>>;
}): React.ReactNode => <SvgIcon icon={icon} color="#fff" />;

interface CustomList {
  id: string;
  title: string;
  icon: React.ReactNode;
  required: boolean;
  disableTaskCreation?: boolean;
}

const lists: CustomList[] = [
  {
    id: "inbox",
    title: "Inbox",
    icon: ListItemIcon({ icon: Inbox }),
    required: true
  },
  {
    id: "newList",
    title: "New List",
    icon: ListItemIcon({ icon: Feather }),
    required: true
  },
  {
    id: "highPriority",
    title: "High Priority",
    icon: ListItemIcon({ icon: Bookmark }),
    required: false
  },
  {
    id: "today",
    title: "Today",
    icon: <CalendarDayIcon day={getCurrentDay()} size="1.375rem" strokeWidth={1.75} />,
    required: false
  },
  {
    id: "tomorrow",
    title: "Tomorrow",
    icon: <CalendarDayIcon day={getTomorrowDay()} size="1.375rem" strokeWidth={1.75} />,
    required: false
  },
  {
    id: "overdue",
    title: "Overdue",
    icon: ListItemIcon({ icon: AlarmClock }),
    required: false,
    disableTaskCreation: true
  },
  {
    id: "week",
    title: "This Week",
    icon: ListItemIcon({ icon: CalendarDays }),
    required: false,
    disableTaskCreation: true
  }
];

export default lists;

/**
 * Returns the URL-friendly slug for a list.
 * Custom lists (inbox, today, etc.) use their type as the slug.
 * Regular user-created lists use their UUID id.
 */
export function getListSlug(list: { id: string; type?: string }): string {
  if (list.type && list.type !== "default" && list.type !== "newList") {
    return list.type;
  }
  return list.id;
}

export function getCurrentDay() {
  return startOfToday().getDate();
}

export function getTomorrowDay() {
  return startOfTomorrow().getDate();
}
