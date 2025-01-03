import './helpers/toMatchObject';
import createRouter from './helpers/createRouter';
import { connect, disconnect } from '../src/database';
import { createTask } from '../src/controllers/tasks';
import { createList, updateList, getLists, deleteList } from '../src/controllers/lists';
import { RouterOptions } from '../src/helpers/routeHandler';
import { List, ListDocument } from '../src/schemas/lists';

let router1: RouterOptions;
let router2: RouterOptions;
let inbox: List;
let validList1: ListDocument;
let validList2: ListDocument;
beforeAll(async () => {
    await connect();
    router1 = await createRouter();
    router2 = await createRouter();
    inbox = await getLists('inbox', {}, router1);
    validList1 = await createList({ title: 'Valid List' }, router1);
    validList2 = await createList({ title: 'Valid List' }, router2);
});
afterAll(async () => {
    await disconnect();
});

describe('Custom Lists API', () => {
    test("Inbox shouldn't allow modification", async () => {
        await updateList(inbox._id, { title: 'Malicious' }, router1);
        inbox = await getLists('inbox', {}, router1);
        const result = await getLists(inbox._id, {}, router1);
        expect(result.title).toBe('Inbox');
    });

    test("Inbox shouldn't allow deletion", async () => {
        await expect(deleteList(inbox._id, router1)).rejects.toThrowErrorMatchingInlineSnapshot(
            `"Invalid List ID"`
        );
    });

    test('Today list should only return valid tasks', async () => {
        let today = await getLists('today', {}, router1);
        expect(today.tasks).toHaveLength(0);
        const title = `Todo today!`;
        await createTask(validList1._id, { title, dueDate: new Date() }, router1);
        today = await getLists('today', {}, router1);
        expect(today.tasks).toHaveLength(1);
        expect(today.tasks[0].title).toBe(title);
    });

    test('Date based list should return newer tasks first', async () => {
        let today = await getLists('today', {}, router2);
        expect(today.tasks).toHaveLength(0);
        await createTask(validList2._id, { title: '1', dueDate: new Date() }, router2);
        await createTask(validList2._id, { title: '2', dueDate: new Date() }, router2);
        today = await getLists('today', {}, router2);
        expect(today.tasks).toHaveLength(2);
        expect(today.tasks[0].title).toBe('2');
        expect(today.tasks[1].title).toBe('1');
    });

    test('Tomorrow list should only return valid tasks', async () => {
        let today = await getLists('tomorrow', {}, router1);
        expect(today.tasks).toHaveLength(0);
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(12, 30, 0, 0);
        const title = `Todo tomorrow!`;
        await createTask(validList1._id, { title, dueDate: tomorrow }, router1);
        today = await getLists('tomorrow', {}, router1);
        expect(today.tasks).toHaveLength(1);
        expect(today.tasks[0].title).toBe(title);
    });

    test('High priority list should only return valid tasks', async () => {
        await createTask(validList1._id, { title: 'Invalid because not high-priority' }, router1);
        await createTask(
            validList2._id,
            { title: 'Invalid because wrong user', priority: 'high' },
            router2
        );
        const title = `Todo high priority!`;
        await createTask(validList1._id, { title, priority: 'high' }, router1);
        const user1lists = await getLists('highPriority', {}, router1);
        expect(user1lists.tasks).toHaveLength(1);
        expect(user1lists.tasks[0].title).toBe(title);
    });

    test('Should allow creating high priority tasks from highPriority list', async () => {
        const task = await createTask('highPriority', { title: 'title' }, router1);
        expect(task.priority).toBe('high');
        const hpList = await getLists('highPriority', {}, router1);
        expect(hpList.tasks.map(t => t._id)).toContainId(task._id);
        const inbox = await getLists('inbox', {}, router1);
        expect(inbox.tasks.map(t => t._id)).toContainId(task._id);
    });

    test('Should allow creating tasks due today from today list', async () => {
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        const task = await createTask('today', { title: 'title' }, router1);
        expect(task.dueDate.toString()).toBe(now.toString());
        const list = await getLists('today', {}, router1);
        expect(list.tasks.map(t => t._id)).toContainId(task._id);
        const inbox = await getLists('inbox', {}, router1);
        expect(inbox.tasks.map(t => t._id)).toContainId(task._id);
    });

    test('Should allow creating tasks due tomorrow from tomorrow list', async () => {
        const now = new Date();
        now.setDate(now.getDate() + 1);
        now.setHours(0, 0, 0, 0);
        const task = await createTask('tomorrow', { title: 'title' }, router1);
        expect(task.dueDate.toString()).toBe(now.toString());
        const list = await getLists('tomorrow', {}, router1);
        expect(list.tasks.map(t => t._id)).toContainId(task._id);
        const inbox = await getLists('inbox', {}, router1);
        expect(inbox.tasks.map(t => t._id)).toContainId(task._id);
    });

    test('Should allow returning additional tasks', async () => {
        const task = await createTask(
            'highPriority',
            { title: 'title', isCompleted: true },
            router1
        );
        let list = await getLists('highPriority', {}, router1);
        expect(list.tasks.map(t => t._id.toString())).not.toContain(task._id.toString());
        expect(list.additionalTasks).toBe(1);
        expect(list.completedTasks).toHaveLength(0);
        list = await getLists('highPriority', { includeCompleted: true }, router1);
        expect(list.completedTasks.map((t: any) => t._id.toString())).toContain(
            task._id.toString()
        );
        expect(list.additionalTasks).toBe(0);
    });
});
