import session from "express-session";
import MongoStore from "connect-mongo";
import { MONGO_CONNECTION_URL } from "../database";
import { InternalRouter } from "../helpers/routeHandler";

export default ({ app }: InternalRouter): void => {
  app.use(
    session({
      secret: process.env.SESSION_SECRET || "",
      resave: false,
      saveUninitialized: true,
      store: new MongoStore({ mongoUrl: MONGO_CONNECTION_URL }),
      cookie: {
        // sameSite: 'none',
        maxAge: 1000 * 60 * 60 * 24 * 31 * 6 // ms * sec * mins * hours * days * 6 = ~ 6 months
      }
    })
  );
};
