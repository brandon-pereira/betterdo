export async function getList(
    listId: string,
    opts: GetListOptions,
    { db, user, notifier }: RouterOptions
): Promise<List> {
    const list = await db.Lists.getList(user._id, listId);
    if (!list) {
        throwError('Invalid List ID');
    }
    if (includeCompleted) {
        await list.populate({
            path: 'completedTasks',
            populate: {
                path: 'createdBy',
                model: 'User',
                select: ['_id', 'firstName', 'lastName', 'profilePicture']
            }
        });
    }
    return {
        type: list.type,
        owner: list.owner,
        additionalTasks: includeCompleted ? 0 : list.additionalTasks,
        completedTasks: includeCompleted ? list.completedTasks : [],
        color: list.color,
        _id: list._id,
        title: list.title,
        tasks: list.tasks,
        members: list.members
    };
}
