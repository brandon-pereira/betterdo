import './helpers/toMatchObject';
import createRouter from './helpers/createRouter';
import db, { connect, disconnect } from '../src/database';
import { ListDocument } from '../src/schemas/lists';
import { createTask, updateTask, deleteTask, getTask } from '../src/controllers/tasks';
import { createList, getLists } from '../src/controllers/lists';
import { RouterOptions } from '../src/helpers/routeHandler';

const { Lists } = db;

let router: RouterOptions;
let validList: ListDocument;

beforeAll(async () => {
    await connect();
    router = await createRouter();
    validList = await createList({ title: 'Valid List' }, router);
});

afterAll(async () => {
    await disconnect();
});

describe('Tasks API', () => {
    test('Can be created with valid data', async () => {
        const task = await createTask(validList._id, { title: 'Test' }, router);
        expect(task.list).toEqual(validList._id);
        expect(task.title).toBe('Test');
    });

    test('Can retrieve task details when queried', async () => {
        const createdTask = await createTask(validList._id, { title: 'Test' }, router);
        const task = await getTask(createdTask._id, router);
        expect(task.list).toMatchId(validList._id);
        expect(task._id).toMatchId(createdTask._id);
        expect(task.title).toBe('Test');
    });

    test('Adds/removes tasks to list object on relevant task', async () => {
        const list = await createList({ title: 'New List' }, router);
        const task = await createTask(list._id, { title: 'Test' }, router);
        await Lists.addTaskToList(task._id, list._id); // ensure no duplicates
        let _list = await Lists.findById(list._id);
        expect(_list?.tasks).toContainEqual(task._id);
        expect(_list?.tasks).toHaveLength(1); // if 2, not deduping
        await deleteTask(task._id, router);
        _list = await Lists.findById(list._id);
        expect(_list?.tasks).toHaveLength(0);
    });

    test('Allows list to be changed via the updateTask method', async () => {
        const list1 = await createList({ title: 'New List 1' }, router);
        const list2 = await createList({ title: 'New List 2' }, router);
        const task = await createTask(list1._id, { title: 'Test' }, router);
        await updateTask(task._id, { list: list2._id }, router);
        const _list1 = await Lists.findById(list1._id);
        const _list2 = await Lists.findById(list2._id);
        expect(_list1?.tasks).not.toContainEqual(task._id);
        expect(_list2?.tasks).toContainEqual(task._id);
    });

    test('Allows tasks to be set to complete and returns correct count', async () => {
        const list = await createList({ title: 'New List' }, router);
        expect(list.additionalTasks).toBe(0);
        expect(list.tasks).toHaveLength(0);
        const task = await createTask(list._id, { title: 'Test' }, router);
        let _list = await getLists(list._id, {}, router);
        expect(_list?.additionalTasks).toBe(0);
        expect(_list?.tasks).toHaveLength(1);
        await updateTask(task._id, { isCompleted: true }, router);
        _list = await getLists(_list._id, {}, router);
        expect(_list?.additionalTasks).toBe(1);
        expect(_list?.tasks).toHaveLength(0);
        _list = await getLists(_list._id, { includeCompleted: true }, router);
        expect(_list?.additionalTasks).toBe(0);
        expect(_list?.completedTasks).toHaveLength(1);
        expect(_list?.tasks).toHaveLength(0);
        await updateTask(task._id, { isCompleted: false }, router);
        _list = await getLists(_list._id, {}, router);
        expect(_list?.additionalTasks).toBe(0);
        expect(_list?.tasks).toHaveLength(1);
        _list = await getLists(_list._id, { includeCompleted: true }, router);
        expect(_list?.additionalTasks).toBe(0);
        expect(_list?.completedTasks).toHaveLength(0);
        expect(_list?.tasks).toHaveLength(1);
        const list2 = await createList({ title: 'New List 2' }, router);
        await updateTask(task._id, { list: list2._id, isCompleted: true }, router);
        _list = await getLists(_list._id, {}, router);
        let _list2 = await getLists(list2._id, {}, router);
        expect(_list?.additionalTasks).toBe(0);
        expect(_list?.tasks).toHaveLength(0);
        expect(_list2?.additionalTasks).toBe(1);
        expect(_list2?.tasks).toHaveLength(0);
        await updateTask(task._id, { list: list._id }, router);
        _list = await getLists(list._id, {}, router);
        _list2 = await getLists(_list2._id, {}, router);
        expect(list2?.additionalTasks).toBe(0);
        expect(list2?.tasks).toHaveLength(0);
        expect(_list?.additionalTasks).toBe(1);
        expect(_list?.tasks).toHaveLength(0);
    });

    test('Provides clear error messages when invalid data provided', async () => {
        await expect(
            // @ts-expect-error: we are purposefully passing bad priority
            createTask(validList._id, { title: 'Hello', priority: 'super-high' }, router)
        ).rejects.toThrow(
            'Task validation failed: priority: `super-high` is not a valid enum value for path `priority`.'
        );
    });

    test('Protects sensitive fields', async () => {
        const task = await createTask(
            validList._id,
            // @ts-expect-error: mocking this for test case
            { title: 'Test', createdBy: 'bad-user' },
            router
        );
        expect(task.title).toBe('Test');
        expect(task.createdBy).toBeDefined();
        expect(typeof task.createdBy).toBe('object');
    });

    test('Protects against modifying protected fields', async () => {
        const task = await createTask(validList._id, { title: 'Test' }, router);
        await expect(updateTask(task._id, { creationDate: new Date() }, router)).rejects.toThrow(
            'Task validation failed: creationDate: Not permitted to modify creationDate!'
        );
    });

    test('Protects against non-member modification', async () => {
        const badGuy = await createRouter();
        let task = await createTask(validList._id, { title: 'Good Task' }, router);
        task = await updateTask(task._id, { title: 'Good Update' }, router);
        await expect(updateTask(task._id, { title: 'Bad Update' }, badGuy)).rejects.toThrow(
            'User is not authorized to access task'
        );
        const badGuysList = await createList({ title: 'Bad Guys List' }, badGuy);
        await expect(updateTask(task._id, { list: badGuysList._id }, router)).rejects.toThrow(
            'User is not authorized to access list'
        );
    });

    test('Protects against non-member deletion', async () => {
        const badGuy = await createRouter();
        const task = await createTask(validList._id, { title: 'Good Task' }, router);
        await expect(deleteTask(task._id, badGuy)).rejects.toThrow(
            'User is not authorized to access task'
        );
    });
});
