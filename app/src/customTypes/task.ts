import type { Priority } from "@betterdo/shared/types";
import User from "./user";

interface Task {
  id: string;
  title: string;
  listId: string;
  isCompleted: boolean;
  createdBy: User;
  notes: string;
  dueDate: string;
  creationDate: string;
  priority: Priority;
  isLoading?: boolean;
  isTemporaryTask?: boolean;
}

export default Task;
