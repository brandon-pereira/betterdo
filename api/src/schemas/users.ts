import { model, Schema } from 'mongoose';
import { Document, PopulatedDoc, Model } from 'mongoose';
import { ObjectId } from 'mongodb';
import { List, ListDocument } from './lists';
import { timeZonesNames } from '@vvo/tzdb';

export interface User {
    _id: ObjectId;
    email: string;
    firstName: string;
    lastName: string;
    lists: Array<PopulatedDoc<ListDocument>>;
    isPushEnabled: boolean;
    pushSubscriptions: Array<string>;
    timeZone: string;
    customLists: {
        highPriority?: boolean;
        today?: boolean;
        tomorrow?: boolean;
        overdue?: boolean;
        week?: boolean;
    };
    pushSubscription?: string;
    profilePicture: string;
    isBeta: boolean;
    lastLogin: Date;
    creationDate: Date;
    google_id: string;
}

export type UserDocument = User & Document;

export interface UserModel extends Model<UserDocument> {
    getLists(userId: ObjectId): Promise<Array<ListDocument>>;
    removeListFromUser(listId: ObjectId, user: User): Promise<User>;
    addListToUser(listId: ObjectId, user: User): Promise<User>;
}

const UserSchema = new Schema<UserDocument, UserModel>({
    google_id: {
        type: String,
        unique: true,
        sparse: true,
        index: true
    },
    firstName: {
        type: String,
        required: true,
        maxlength: 100,
        minlength: 1
    },
    lastName: {
        type: String,
        maxlength: 100
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        index: true,
        match: /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/
    },
    creationDate: {
        type: Date,
        default: () => new Date()
    },
    profilePicture: String,
    lastLogin: {
        type: Date,
        default: () => new Date()
    },
    timeZone: {
        type: String,
        enum: timeZonesNames,
        default: 'America/Edmonton'
    },
    isBeta: {
        type: Boolean,
        default: false
    },
    isPushEnabled: {
        type: Boolean,
        default: true
    },
    customLists: {
        highPriority: {
            type: Boolean,
            default: true
        },
        today: {
            type: Boolean,
            default: true
        },
        tomorrow: {
            type: Boolean,
            default: false
        },
        overdue: {
            type: Boolean,
            default: false
        },
        week: {
            type: Boolean,
            default: false
        }
    },
    lists: [
        {
            type: Schema.Types.ObjectId,
            ref: 'List'
        }
    ],
    pushSubscriptions: [
        {
            type: String,
            required: true
        }
    ]
});

UserSchema.statics.getLists = async function (userId: ObjectId): Promise<List[]> {
    const user = await this.findById(userId);
    if (!user) {
        return [];
    }
    await user.populate('lists');
    return user.lists;
};

UserSchema.statics.addListToUser = async function (listId: ObjectId, _user: UserDocument) {
    if (!_user.lists.find((id: string) => listId.equals(id))) {
        _user.lists.push(listId as unknown as string);
        await _user.save();
    }
    return _user;
};

UserSchema.statics.removeListFromUser = async function (listId: ObjectId, _user: UserDocument) {
    const index = _user.lists.findIndex((id: string) => listId.equals(id));
    if (index >= 0) {
        _user.lists.splice(index, 1);
        await _user.save();
    }
    return _user;
};

const User: UserModel = model<UserDocument, UserModel>('User', UserSchema);

export default User;
