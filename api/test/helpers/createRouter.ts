import db from '../../src/database';
import { UserDocument } from '../../src/schemas/users';
import { RouterOptions } from '../../src/helpers/routeHandler';
import { Notifier } from '../../src/notifier';

const createMockedNotifier = () =>
    ({
        send: jest.fn(),
        schedule: jest.fn()
    }) as unknown as Notifier;

const createUser = async (): Promise<UserDocument> => {
    const user = new db.Users({
        firstName: 'unitTest',
        email: `${Date.now()}-${Math.random()}@unitTests.com`,
        customLists: {
            highPriority: false,
            today: false
        }
    });
    await user.save();
    const inbox = new db.Lists({
        title: 'Inbox',
        type: 'inbox',
        owner: user._id
    });
    await inbox.save();
    return user;
};

const createRouter = async (): Promise<RouterOptions> => {
    const _user = await createUser();
    return {
        user: _user,
        db,
        notifier: createMockedNotifier()
    };
};

export default createRouter;
