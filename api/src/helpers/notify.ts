import { List } from '../schemas/lists';
import { RouterOptions } from './routeHandler';
import url from 'url';

const BASE_URL = url.resolve(
    process.env.APP_URL || '',
    process.env.NODE_ENV === 'production' ? '/app' : ''
);

function notifyAboutSharedList(title: string, list: List, { notifier, user }: RouterOptions): void {
    const members = list.members;
    const listId = list._id;
    const isSharedList = members.length > 1;

    if (isSharedList) {
        members.map(async member => {
            if (!member._id.equals(user._id)) {
                await notifier.send(member._id, {
                    title,
                    url: `${BASE_URL}/#/${listId}`,
                    tag: `shared-list:${listId}`,
                    data: {
                        listId: listId.toString(),
                        listTitle: list.title
                    }
                });
            }
        });
    }
}

export { notifyAboutSharedList };
