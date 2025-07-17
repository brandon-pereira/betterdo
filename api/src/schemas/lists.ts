import { model, Schema, ValidatorProps, Document, PopulatedDoc, Model } from "mongoose";
import { ObjectId } from "mongodb";
import { User, UserDocument } from "./users";
import { Task, TaskDocument } from "./tasks";
import { throwError } from "../helpers/errorHandler";

export interface List {
  _id: ObjectId | string;
  title: string;
  tasks: Array<PopulatedDoc<TaskDocument>>;
  completedTasks: Array<string>;
  members: Array<PopulatedDoc<UserDocument>>;
  owner: PopulatedDoc<UserDocument>;
  // can we deprecate this to 'customList' | 'inbox' | 'default'
  type: "inbox" | "today" | "tomorrow" | "highPriority" | "week" | "overdue" | "default";
  additionalTasks?: number;
  color: string;
}

export type ListDocument = List & Document;
export interface ListModel extends Model<ListDocument> {
  getList(userId: ObjectId, listId: ObjectId | string): Promise<ListDocument>;
  removeListFromUser(listId: ObjectId, user: User): Promise<User>;
  addListToUser(listId: ObjectId, user: User): Promise<User>;
  getUserInbox(userId: ObjectId): Promise<ListDocument>;
  getUserListById(userId: ObjectId, listId: ObjectId): Promise<ListDocument>;
  populateList(list: ListDocument | null): Promise<ListDocument>;
  addTaskToList(task: TaskDocument, listId: ObjectId): Promise<ListDocument>;
  removeTaskFromList(task: TaskDocument, listId: ObjectId): Promise<ListDocument>;
  setTaskComplete(task: TaskDocument, listId: ObjectId): Promise<ListDocument>;
  setTaskIncomplete(task: TaskDocument, listId: ObjectId): Promise<ListDocument>;
  removeTaskFromCompletedTasksList(taskId: ObjectId, list: ListDocument): ListDocument;
  removeTaskFromTasksList(taskId: ObjectId, list: ListDocument): ListDocument;
  addTaskToCompletedTasksList(taskId: ObjectId, list: ListDocument): void;
  addTaskToTasksList(taskId: ObjectId, list: ListDocument): void;
}

const ListSchema = new Schema<ListDocument, ListModel>(
  {
    title: {
      type: String,
      required: true,
      maxlength: 100,
      minlength: 1
    },
    owner: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    members: [
      {
        type: Schema.Types.ObjectId,
        ref: "User"
      }
    ],
    type: {
      type: String,
      default: "default",
      enum: ["inbox", "today", "tomorrow", "highPriority", "default"]
    },
    tasks: [
      {
        type: Schema.Types.ObjectId,
        ref: "Task"
      }
    ],
    completedTasks: [
      {
        type: Schema.Types.ObjectId,
        ref: "Task"
      }
    ],
    color: {
      type: String,
      default: "#666666",
      validate: {
        validator: (value: string) => /(^#[0-9A-F]{6}$)|(^#[0-9A-F]{3}$)/i.test(value),
        message: (props: ValidatorProps) => `${props.value} is not a hex color code!`
      }
    }
  },
  {
    toObject: { virtuals: true },
    toJSON: { virtuals: true }
  }
);

ListSchema.virtual("additionalTasks").get(function (this: ListDocument) {
  return this.completedTasks ? this.completedTasks.length : 0;
});

ListSchema.pre<ListDocument>("save", function () {
  if (this.isNew) {
    this.members = [this.owner];
  }
});

ListSchema.pre<ListDocument>("validate", function () {
  const nonEditableFields = ["owner", "type"];
  nonEditableFields.forEach(field => {
    if (!this.isNew && this.isModified(field)) {
      this.invalidate(field, `Not permitted to modify ${field}!`);
    }
  });

  if (!this.isNew && this.isModified("members") && !this.members.find(member => member._id.equals(this.owner))) {
    this.invalidate("members", `Not permitted to remove owner!`);
  }
});

ListSchema.statics.getList = async function (user_id: ObjectId, list_id: ObjectId | string) {
  if (list_id === "inbox") {
    return this.getUserInbox(user_id);
  } else {
    try {
      const _list = await this.findOne({
        _id: list_id,
        members: user_id.toString()
      });
      if (_list) {
        return this.populateList(_list);
      } else {
        throwError("Invalid List ID");
      }
    } catch (err) {
      return null;
    }
  }
};

ListSchema.statics.populateList = async function (list: ListDocument) {
  if (!list) {
    return null;
  }
  const userQueryData = ["_id", "firstName", "lastName", "profilePicture"];
  await list.populate({
    path: "tasks",
    populate: {
      path: "createdBy",
      model: "User",
      select: userQueryData
    }
  });
  await list.populate({ path: "members", select: userQueryData });
  return list;
};

ListSchema.statics.getUserInbox = async function (user_id: ObjectId) {
  return this.populateList(
    await this.findOne({
      type: "inbox",
      members: user_id.toString()
    })
  );
};

ListSchema.statics.getUserListById = async function (user_id: ObjectId, list_id: ObjectId) {
  return this.populateList(
    await this.findOne({
      _id: list_id,
      members: user_id.toString()
    })
  );
};

ListSchema.statics.addTaskToList = async function (task: Task, list_id: ObjectId) {
  // Find lists
  const _list = await List.findOne({ _id: list_id });
  // If not a list, return null
  if (!_list) {
    return null;
  }
  // Add task to appropriate list
  if (!task.isCompleted) {
    this.addTaskToTasksList(task._id, _list);
  } else {
    this.addTaskToCompletedTasksList(task._id, _list);
  }
  // Save/return
  await _list.save();
  return _list;
};

ListSchema.statics.removeTaskFromList = async function (task: Task, list_id: ObjectId) {
  // Find list
  const _list = await List.findOne({ _id: list_id });
  if (!_list) return null;
  // Remove from lists
  this.removeTaskFromTasksList(task._id, _list);
  this.removeTaskFromCompletedTasksList(task._id, _list);
  // Save/return
  await _list.save();
  return _list;
};

ListSchema.statics.setTaskComplete = async function (task: Task, list_id: ObjectId) {
  // Find list
  const _list = await List.findOne({ _id: list_id });
  if (!_list) return null;
  // Remove from lists
  this.removeTaskFromTasksList(task._id, _list);
  this.addTaskToCompletedTasksList(task._id, _list);
  // Save/return
  await _list.save();
  return _list;
};

ListSchema.statics.setTaskIncomplete = async function (task: Task, list_id: ObjectId) {
  // Find list
  const _list = await List.findOne({
    _id: list_id
  });
  if (!_list) return null;
  // Remove from lists
  this.removeTaskFromCompletedTasksList(task._id, _list);
  this.addTaskToTasksList(task._id, _list);
  // Save/return
  await _list.save();
  return _list;
};

ListSchema.statics.removeTaskFromCompletedTasksList = function (task_id: ObjectId, _list: ListDocument) {
  const index = _list.completedTasks.findIndex((id: string) => task_id.equals(id));
  // Remove from completed tasks
  if (index >= 0) {
    _list.completedTasks.splice(index, 1);
  }
  return _list;
};

ListSchema.statics.removeTaskFromTasksList = function (task_id: ObjectId, list: ListDocument) {
  const index = list.tasks.findIndex((id: ObjectId) => task_id.equals(id));
  // Remove from tasks
  if (index >= 0) {
    list.tasks.splice(index, 1);
  }
  return list;
};

ListSchema.statics.addTaskToCompletedTasksList = function (task_id: ObjectId, list: ListDocument) {
  if (!list.completedTasks.find((id: string) => task_id.equals(id.toString()))) {
    list.completedTasks.unshift(task_id as unknown as string);
  }
};

ListSchema.statics.addTaskToTasksList = function (task_id: ObjectId, list: ListDocument) {
  if (!list.tasks.find((id: string) => task_id.equals(id))) {
    list.tasks.unshift(task_id as unknown as string);
  }
};

const List: ListModel = model<ListDocument, ListModel>("List", ListSchema);

export default List;
