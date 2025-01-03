import { throwError } from '../helpers/errorHandler';
import { parseObjectID } from '../helpers/objectIds';
import { ObjectId } from 'mongodb';
import { isCustomList, modifyTaskForCustomList } from '../helpers/customLists';
import { notifyAboutSharedList } from '../helpers/notify';
import { ListDocument } from '../schemas/lists';
import { RouterOptions } from '../helpers/routeHandler';
import { Task, TaskDocument } from '../schemas/tasks';
import { timezone } from '../helpers/timezone';
import { startOfDay } from 'date-fns';

export async function createTask(
    listId: ObjectId | string,
    taskObj: Partial<Task> = {},
    router: RouterOptions
): Promise<TaskDocument> {
    const { db, user } = router;
    // Ensure list id is passed
    if (!listId) throwError('Invalid List ID');
    // If the list is a custom list, modify task with new settings
    if (typeof listId === 'string' && isCustomList(listId)) {
        taskObj = modifyTaskForCustomList(listId, taskObj, router);
        listId = 'inbox';
    }
    let list: ListDocument;
    if (listId === 'inbox') {
        list = await db.Lists.getUserInbox(user._id);
    } else {
        // Ensure list exists and user has permissions
        list = await db.Lists.getList(user._id, parseObjectID(listId));
    }
    // this time should come in as UTC
    if (taskObj.dueDate && typeof taskObj.dueDate === 'string') {
        // update it to reflect users timeZone and start of day since we dont manage times (yet)
        taskObj.dueDate = startOfDay(timezone(new Date(taskObj.dueDate), user.timeZone));
    }
    // If no results, throw error
    if (!list) throwError('Invalid List ID');
    // Remove potentially harmful properties
    delete taskObj.list;
    delete taskObj.createdBy;
    delete taskObj.creationDate;
    // Attempt to create the list
    const task = await db.Tasks.create({
        ...taskObj,
        createdBy: user._id,
        list: list._id
    });
    // Add task to list
    await db.Lists.addTaskToList(task, list._id);
    // Notify about shared list task addition
    notifyAboutSharedList(`${user.firstName} added ${task.title} to ${list.title}.`, list, router);
    // Populate task fields
    await db.Tasks.populateTask(task);
    // Return new list to front-end
    return task;
}

export async function updateTask(
    taskId: ObjectId | string,
    updatedTask: Partial<Task> = {},
    { db, user, notifier }: RouterOptions
): Promise<TaskDocument> {
    let notificationSent = false;
    // Ensure list id is passed
    if (!taskId) throwError('Invalid Task ID');
    // Get task
    const task = await db.Tasks.findOne({ _id: taskId });
    // If no results, throw error
    if (!task) throwError('Invalid Task ID');
    // Get List
    let list = await db.Lists.getUserListById(user._id, task.list);
    // Ensure valid permissions
    if (!list) {
        throwError('User is not authorized to access task', 'PermissionsError');
    }
    // Code for handling change of list
    if (updatedTask.list && !task.list.equals(updatedTask.list)) {
        // Get new list
        const newList = await db.Lists.getUserListById(user._id, updatedTask.list);
        // Verify updatedTask.list is valid list
        if (!newList) {
            throwError('User is not authorized to access list', 'PermissionsError');
        }
        // Remove from this list
        await db.Lists.removeTaskFromList(task, list._id);
        // Add to new list
        await db.Lists.addTaskToList(task, newList._id);
        // Set to new list so that later code doesn't need to process
        task.list = updatedTask.list;
        list = newList;
    }
    // If the task isCompleted state changed
    if (updatedTask.isCompleted !== undefined && task.isCompleted !== updatedTask.isCompleted) {
        if (updatedTask.isCompleted) {
            notificationSent = true;
            // Notify about shared list task deletion
            notifyAboutSharedList(
                `${user.firstName} completed ${task.title} in ${list.title}.`,
                list,
                {
                    notifier,
                    user,
                    db
                }
            );
            await db.Lists.setTaskComplete(task._id, list._id);
        } else {
            await db.Lists.setTaskIncomplete(task._id, list._id);
        }
    }
    // this time should come in as UTC
    if (updatedTask.dueDate && typeof updatedTask.dueDate === 'string') {
        // update it to reflect users timeZone
        updatedTask.dueDate = timezone(new Date(updatedTask.dueDate), user.timeZone);
    }
    // Merge the tasks.. validation on the model will handle errors
    Object.assign(task, updatedTask);
    // Save the model
    await task.save();
    // Notify about shared list update
    if (!notificationSent) {
        notifyAboutSharedList(`${user.firstName} updated ${task.title} in ${list.title}.`, list, {
            notifier,
            user,
            db
        });
    }
    // Populate task fields
    await db.Tasks.populateTask(task);
    // Return list to front-end
    return task;
}

export async function getTask(
    taskId: ObjectId | string,
    { db, user }: RouterOptions
): Promise<TaskDocument> {
    // Ensure list id is passed
    if (!taskId) throwError('Invalid Task ID');
    // Get task
    const task = await db.Tasks.findById(taskId);
    // Ensure task id is valid
    if (!task) throwError('Invalid Task ID');
    // Get parent list
    const list = await db.Lists.getUserListById(user._id, task.list);
    // Ensure valid permissions
    if (!list) throwError('User is not authorized to access task', 'PermissionsError');
    // Populate task fields
    await db.Tasks.populateTask(task);
    // Return task to front-end
    return task;
}

interface GenericStatus {
    success: boolean;
}
export async function deleteTask(
    taskId: ObjectId | string,
    { db, user, notifier }: RouterOptions
): Promise<GenericStatus> {
    // Ensure list id is passed
    if (!taskId) throwError('Invalid Task ID');
    // Get task
    const task = await db.Tasks.findById(taskId);
    // Ensure task id is valid
    if (!task) throwError('Invalid Task ID');
    // Get parent list
    const list = await db.Lists.getUserListById(user._id, task.list);
    // Ensure valid permissions
    if (!list) throwError('User is not authorized to access task', 'PermissionsError');
    // Remove task from list
    await db.Lists.removeTaskFromList(task._id, task.list);
    // Delete task
    await db.Tasks.deleteOne({ _id: task._id });
    // Notify about shared list task deletion
    notifyAboutSharedList(`${user.firstName} deleted ${task.title} from ${list.title}.`, list, {
        notifier,
        user,
        db
    });
    return { success: true };
}
