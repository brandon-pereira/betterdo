import mongoose from 'mongoose';
import { connection } from 'mongoose';
import Users, { UserModel } from './schemas/users';
import Lists, { ListModel } from './schemas/lists';
import Tasks, { TaskModel } from './schemas/tasks';

export interface Database {
    connection: typeof connection;
    Users: UserModel;
    Lists: ListModel;
    Tasks: TaskModel;
}

mongoose.set('strictQuery', false);

export const MONGO_CONNECTION_URL =
    process.env.MONGO_URL || `mongodb://0.0.0.0/${process.env.DATABASE_NAME || 'betterdo'}`;

export async function connect(): Promise<void> {
    await mongoose.connect(MONGO_CONNECTION_URL || '');
}

export async function disconnect(): Promise<void> {
    await mongoose.disconnect();
}

const db: Database = {
    connection: mongoose.connection,
    Lists,
    Tasks,
    Users
};

export default db;
