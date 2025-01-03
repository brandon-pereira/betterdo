import passport from 'passport';
import { InternalRouter } from '../helpers/routeHandler';

export default ({ app, db }: InternalRouter): void => {
    passport.serializeUser((user, done): void => done(null, user._id));

    passport.deserializeUser(async (_id: string, done) => {
        const user = await db.Users.findById(_id);
        if (user) {
            return done(null, user);
        }
        return done({ message: 'AuthenticationRequired' });
    });

    app.use(passport.initialize());
    app.use(passport.session());
};
