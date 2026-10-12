import type { Priority } from "@betterdo/shared/types";
import User from "./user";

export interface Subtask {
  // Id is temporary because it could be a temp task
  id?: string;
  title: string;
  isComplete: boolean;
}

interface Task {
  id: string;
  title: string;
  listId: string;
  isCompleted: boolean;
  createdBy: User;
  notes: string;
  subtasks: Subtask[];
  dueDate: string;
  creationDate: string;
  priority: Priority;
  isLoading?: boolean;
  isTemporaryTask?: boolean;
}

export default Task;
