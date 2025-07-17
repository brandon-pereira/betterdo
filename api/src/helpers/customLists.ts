import { ObjectId } from "mongodb";
import { List, ListDocument } from "../schemas/lists";
import { Task } from "../schemas/tasks";
import { RouterOptions } from "./routeHandler";
import { timezone } from "../helpers/timezone";
import { startOfWeek, endOfWeek, startOfDay, endOfDay, addDays } from "date-fns";

const CUSTOM_LISTS = ["highPriority", "today", "tomorrow", "overdue", "week"];

export function isCustomList(listId: ObjectId | string): boolean {
  if (typeof listId !== "string") return false;
  return CUSTOM_LISTS.includes(listId);
}

export async function getAccountsCustomLists(router: RouterOptions): Promise<Array<ListDocument>> {
  const listsPromise = Object.entries(router.user.customLists).map(([key, value]) =>
    value ? getCustomListById(key, false, router) : null
  );
  const lists = await Promise.all(listsPromise);
  return lists.filter((o): o is ListDocument => !!o);
}

export async function getCustomListById(
  id: string,
  includeCompleted = false,
  opts: RouterOptions
): Promise<List | null> {
  // fetch list
  let list = null;
  if (id === "highPriority") {
    list = await fetchHighPriority(opts);
  } else if (id === "today") {
    list = await fetchToday(opts);
  } else if (id === "tomorrow") {
    list = await fetchTomorrow(opts);
  } else if (id === "overdue") {
    list = await fetchOverdue(opts);
  } else if (id === "week") {
    list = await fetchWeek(opts);
  }
  // calculate completed tasks visible
  if (list && !includeCompleted) {
    list.completedTasks = [];
  } else if (list && includeCompleted) {
    list.additionalTasks = 0;
  }
  return list;
}

async function fetchHighPriority(router: RouterOptions): Promise<List> {
  const { db, user } = router;
  const { completedTasks, tasks } = await fetchHighPriorityTasks(router);
  const list = new db.Lists({
    title: "High Priority",
    type: "highPriority",
    completedTasks,
    tasks,
    members: [user._id],
    owner: user._id
  }).toObject<List>();
  list._id = "highPriority";

  return list;
}

async function fetchTomorrow(router: RouterOptions): Promise<List> {
  const { db, user } = router;
  const { completedTasks, tasks } = await fetchTomorrowTasks(router);
  const list = new db.Lists({
    title: "Tomorrow",
    type: "tomorrow",
    completedTasks,
    tasks,
    members: [user._id],
    owner: user._id
  }).toObject<List>();
  list._id = "tomorrow";

  return list;
}

async function fetchWeek(router: RouterOptions): Promise<List> {
  const { db, user } = router;
  const { completedTasks, tasks } = await fetchWeeklyTasks(router);
  const list = new db.Lists({
    title: "This Week",
    type: "week",
    completedTasks,
    tasks,
    members: [user._id],
    owner: user._id
  }).toObject<List>();
  list._id = "week";

  return list;
}

async function fetchOverdue(router: RouterOptions): Promise<List> {
  const { db, user } = router;
  const { completedTasks, tasks } = await fetchOverdueTasks(router);
  const list = new db.Lists({
    title: "Overdue",
    type: "overdue",
    completedTasks,
    tasks,
    members: [user._id],
    owner: user._id
  }).toObject<List>();
  list._id = "overdue";

  return list;
}

async function fetchToday(router: RouterOptions): Promise<List> {
  const { db, user } = router;
  const { completedTasks, tasks } = await fetchTodayTasks(router);
  const list = new db.Lists({
    title: "Today",
    type: "today",
    tasks,
    completedTasks,
    members: [user._id],
    owner: user._id
  }).toObject<List>();
  list._id = "today";

  return list;
}

async function fetchHighPriorityTasks({ db, user }: RouterOptions): Promise<SortedTasks> {
  const tasks = await db.Tasks.find({
    priority: "high"
  })
    .populate({
      path: "list",
      select: "members",
      match: { members: { $in: [user._id] } }
    })
    .exec();
  // Populate all created by
  await Promise.all(tasks.map(task => db.Tasks.populateTask(task)));
  return sortTasks(tasks);
}

async function fetchOverdueTasks({ db, user }: RouterOptions): Promise<SortedTasks> {
  const startOfToday = timezone(new Date(), user.timeZone);
  startOfToday.setHours(0, 0, 0, 0);
  const tasks = await db.Tasks.find({
    isCompleted: false,
    dueDate: { $lt: startOfToday }
  })
    .populate({
      path: "list",
      select: "members",
      match: { members: { $in: [user._id] } }
    })
    .exec();
  // Populate all created by
  await Promise.all(tasks.map(task => db.Tasks.populateTask(task)));
  return sortTasks(tasks);
}

export function modifyTaskForCustomList(listId: string, taskObj: Partial<Task>, router: RouterOptions): Partial<Task> {
  if (listId === "highPriority") {
    taskObj.priority = "high";
  } else if (listId === "today") {
    const today = timezone(new Date(), router.user.timeZone);
    today.setHours(0, 0, 0, 0);
    taskObj.dueDate = today;
  } else if (listId === "tomorrow") {
    const tomorrow = timezone(new Date(), router.user.timeZone);
    tomorrow.setHours(0, 0, 0, 0);
    tomorrow.setDate(tomorrow.getDate() + 1);
    taskObj.dueDate = tomorrow;
  }
  return taskObj;
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

async function fetchTasksWithinDates(lowest: Date, highest: Date, { user, db }: RouterOptions): Promise<SortedTasks> {
  const tasks = await db.Tasks.find({ dueDate: { $gte: lowest, $lt: highest } })
    .sort({ creationDate: -1 })
    .populate({ path: "list", select: "members", match: { members: { $in: [user._id] } } })
    .exec();
  // Populate all created by
  await Promise.all(tasks.map(task => db.Tasks.populateTask(task)));
  return sortTasks(tasks);
}

interface SortedTasks {
  completedTasks: Task[];
  tasks: Task[];
}

function sortTasks(unsortedTasks: Task[]): SortedTasks {
  return unsortedTasks
    .filter(tasks => tasks.list) // remove others lists
    .reduce(
      // return object with 2 arrays sorted by complete and incomplete
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
