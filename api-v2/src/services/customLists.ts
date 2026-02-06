import { SQL, and, desc, eq, gte, lt } from "drizzle-orm";
import { addDays, endOfDay, endOfWeek, startOfDay, startOfWeek } from "date-fns";
import { db as defaultDb } from "../db.js";
import { listMembers } from "../schema/list.js";
import { tasks } from "../schema/task.js";
import { user as userTable } from "../schema/auth.js";
import { timezone } from "../utils/timezone.js";
import { CustomListConfig } from "../validators/lists.js";

const CUSTOM_LISTS = ["highPriority", "today", "tomorrow", "overdue", "week"] as const;
type CustomListId = (typeof CUSTOM_LISTS)[number];

const DEFAULT_CUSTOM_LIST_CONFIG: Required<CustomListConfig> = {
  highPriority: true,
  today: true,
  tomorrow: false,
  overdue: false,
  week: false
};

interface SessionUser {
  id: string;
  email?: string | null;
  name?: string | null;
  image?: string | null;
  timeZone: string;
  customLists?: CustomListConfig | null;
}

interface RouterOptions {
  user: SessionUser;
}

interface MemberProfile {
  id: string;
  email?: string | null;
  firstName: string;
  lastName: string;
  profilePicture?: string | null;
}

interface CustomListTask {
  id: string;
  title: string;
  listId: string;
  isCompleted: boolean;
  priority: "low" | "normal" | "high" | null;
  dueDate: Date | null;
  creationDate: Date | null;
  notes: string | null;
  subtasks: unknown;
  createdBy: MemberProfile;
}

interface CustomList {
  id: CustomListId;
  title: string;
  type: CustomListId;
  tasks: CustomListTask[];
  completedTasks: CustomListTask[];
  additionalTasks: number;
  members: MemberProfile[];
  owner: string;
  color: string;
}

interface SortedTasks {
  completedTasks: CustomListTask[];
  tasks: CustomListTask[];
}

export function isCustomList(listId?: string): listId is CustomListId {
  if (typeof listId !== "string") return false;
  return CUSTOM_LISTS.includes(listId as CustomListId);
}

export async function getAccountsCustomLists(opts: RouterOptions): Promise<CustomList[]> {
  const config = resolveCustomListConfig(opts.user);
  const enabledLists = CUSTOM_LISTS.filter(listId => config[listId]);

  const lists = await Promise.all(enabledLists.map(listId => getCustomListById(listId, false, opts)));
  return lists.filter((o): o is CustomList => Boolean(o));
}

export async function getCustomListById(
  id: CustomListId,
  includeCompleted = false,
  opts: RouterOptions
): Promise<CustomList | null> {
  let tasksForList: SortedTasks | null = null;

  if (id === "highPriority") {
    tasksForList = await fetchHighPriorityTasks(opts);
  } else if (id === "today") {
    tasksForList = await fetchTodayTasks(opts);
  } else if (id === "tomorrow") {
    tasksForList = await fetchTomorrowTasks(opts);
  } else if (id === "overdue") {
    tasksForList = await fetchOverdueTasks(opts);
  } else if (id === "week") {
    tasksForList = await fetchWeeklyTasks(opts);
  }

  if (!tasksForList) {
    return null;
  }

  const list: CustomList = {
    id,
    title: toListTitle(id),
    type: id,
    tasks: tasksForList.tasks,
    completedTasks: tasksForList.completedTasks,
    additionalTasks: tasksForList.completedTasks.length,
    members: [buildMemberProfile(opts.user)],
    owner: opts.user.id,
    color: "#666666"
  };

  if (!includeCompleted) {
    list.completedTasks = [];
  } else {
    list.additionalTasks = 0;
  }

  return list;
}

export function modifyTaskForCustomList(
  listId: CustomListId,
  taskObj: Partial<typeof tasks.$inferInsert>,
  router: RouterOptions
): Partial<typeof tasks.$inferInsert> {
  if (listId === "highPriority") {
    taskObj.priority = "high";
  } else if (listId === "today") {
    const today = timezone(new Date(), router.user.timeZone);
    taskObj.dueDate = startOfDay(today);
  } else if (listId === "tomorrow") {
    const tomorrow = timezone(new Date(), router.user.timeZone);
    taskObj.dueDate = startOfDay(addDays(tomorrow, 1));
  }
  return taskObj;
}

async function fetchHighPriorityTasks(router: RouterOptions): Promise<SortedTasks> {
  return fetchTasksByPredicate(eq(tasks.priority, "high"), router);
}

async function fetchOverdueTasks(router: RouterOptions): Promise<SortedTasks> {
  const startOfToday = startOfDay(timezone(new Date(), router.user.timeZone));
  return fetchTasksByPredicate(and(eq(tasks.isCompleted, false), lt(tasks.dueDate, startOfToday)), router);
}

async function fetchTomorrowTasks(router: RouterOptions): Promise<SortedTasks> {
  const tz = timezone(new Date(), router.user.timeZone);
  const tomorrow = addDays(tz, 1);
  const start = startOfDay(tomorrow);
  const end = endOfDay(tomorrow);
  return fetchTasksWithinDates(start, end, router);
}

async function fetchWeeklyTasks(router: RouterOptions): Promise<SortedTasks> {
  const tz = timezone(new Date(), router.user.timeZone);
  const start = startOfWeek(tz);
  const end = endOfWeek(tz);
  return fetchTasksWithinDates(start, end, router);
}

function fetchTodayTasks(router: RouterOptions): Promise<SortedTasks> {
  const tz = timezone(new Date(), router.user.timeZone);
  const start = startOfDay(tz);
  const end = endOfDay(tz);
  return fetchTasksWithinDates(start, end, router);
}

async function fetchTasksWithinDates(lowest: Date, highest: Date, router: RouterOptions): Promise<SortedTasks> {
  return fetchTasksByPredicate(and(gte(tasks.dueDate, lowest), lt(tasks.dueDate, highest)), router);
}

async function fetchTasksByPredicate(whereClause: SQL<unknown>, router: RouterOptions): Promise<SortedTasks> {
  const database = defaultDb;

  const rows = await database
    .select({
      id: tasks.id,
      title: tasks.title,
      listId: tasks.listId,
      isCompleted: tasks.isCompleted,
      priority: tasks.priority,
      dueDate: tasks.dueDate,
      creationDate: tasks.createdAt,
      notes: tasks.notes,
      subtasks: tasks.subtasks,
      createdById: tasks.createdById,
      createdByName: userTable.name,
      createdByEmail: userTable.email,
      createdByImage: userTable.image
    })
    .from(tasks)
    .innerJoin(listMembers, and(eq(listMembers.listId, tasks.listId), eq(listMembers.userId, router.user.id)))
    .innerJoin(userTable, eq(userTable.id, tasks.createdById))
    .where(whereClause)
    .orderBy(desc(tasks.createdAt));

  return sortTasks(
    rows.map(row => ({
      id: row.id,
      title: row.title,
      listId: row.listId,
      isCompleted: row.isCompleted ?? false,
      priority: (row.priority as CustomListTask["priority"]) ?? null,
      dueDate: row.dueDate ?? null,
      creationDate: row.creationDate ?? null,
      notes: row.notes ?? null,
      subtasks: row.subtasks ?? [],
      createdBy: {
        id: row.createdById,
        email: row.createdByEmail ?? undefined,
        firstName: extractFirstName(row.createdByName),
        lastName: extractLastName(row.createdByName),
        profilePicture: row.createdByImage ?? undefined
      }
    }))
  );
}

function sortTasks(unsortedTasks: CustomListTask[]): SortedTasks {
  return unsortedTasks.reduce(
    (acc: SortedTasks, curr) => {
      if (curr.isCompleted) {
        acc.completedTasks.push(curr);
      } else {
        acc.tasks.push(curr);
      }
      return acc;
    },
    { completedTasks: [], tasks: [] }
  );
}

function resolveCustomListConfig(user: SessionUser): Required<CustomListConfig> {
  return {
    ...DEFAULT_CUSTOM_LIST_CONFIG,
    ...(user.customLists || {})
  };
}

function toListTitle(id: CustomListId): string {
  if (id === "highPriority") return "High Priority";
  if (id === "today") return "Today";
  if (id === "tomorrow") return "Tomorrow";
  if (id === "overdue") return "Overdue";
  return "This Week";
}

function buildMemberProfile(user: SessionUser): MemberProfile {
  const firstName = extractFirstName(user.name) || user.email || "";
  const lastName = extractLastName(user.name);
  return {
    id: user.id,
    email: user.email ?? undefined,
    firstName: firstName || "User",
    lastName,
    profilePicture: user.image ?? undefined
  };
}

function extractFirstName(name?: string | null): string {
  if (!name) return "";
  return name.split(" ")[0];
}

function extractLastName(name?: string | null): string {
  if (!name) return "";
  const [, ...rest] = name.split(" ");
  return rest.join(" ");
}
