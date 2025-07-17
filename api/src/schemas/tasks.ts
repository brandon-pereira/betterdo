import { model, Schema, Document, PopulatedDoc, Model } from "mongoose";
import { ObjectId } from "mongodb";
import { ListDocument } from "./lists";

export interface Subtask {
  title: string;
  isComplete: boolean;
}
export interface Task {
  _id: ObjectId;
  title: string;
  isCompleted: boolean;
  list: PopulatedDoc<ListDocument>;
  createdBy: ObjectId;
  notes: string;
  subtasks: Subtask[];
  dueDate: Date;
  creationDate: Date;
  priority: "low" | "normal" | "high";
}

export type TaskDocument = Task & Document;
export interface TaskModel extends Model<TaskDocument> {
  populateTask(task: TaskDocument): Promise<TaskDocument>;
}

const TaskSchema = new Schema<TaskDocument, TaskModel>({
  title: {
    type: String,
    required: true,
    maxlength: 100,
    minlength: 1
  },
  list: {
    type: Schema.Types.ObjectId,
    ref: "List",
    required: true
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  isCompleted: {
    type: Boolean,
    default: false
  },
  dueDate: Date,
  notes: String,
  subtasks: [
    {
      title: {
        type: String,
        maxlength: 200,
        minlength: 1
      },
      isComplete: {
        type: Boolean,
        default: false
      }
    }
  ],
  priority: {
    type: String,
    default: "normal",
    enum: ["low", "normal", "high"]
  },
  creationDate: {
    type: Date,
    default: () => new Date()
  }
});

TaskSchema.pre("validate", function () {
  const nonEditableFields = ["creationDate", "createdBy"];
  nonEditableFields.forEach(field => {
    if (!this.isNew && this.isModified(field)) {
      this.invalidate(field, `Not permitted to modify ${field}!`);
    }
  });
});

TaskSchema.statics.populateTask = async function (taskRef) {
  const userQueryData = ["_id", "firstName", "lastName", "profilePicture"];
  return await taskRef.populate("createdBy", userQueryData);
};

const Task: TaskModel = model<TaskDocument, TaskModel>("Task", TaskSchema);

export default Task;
